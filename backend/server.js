import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pg from 'pg';
import dotenv from 'dotenv';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { isoUint8Array } from '@simplewebauthn/server/helpers';
import base64url from 'base64url';

dotenv.config();

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration from environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';
const DATABASE_URL = process.env.DATABASE_URL;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const RP_ID =
  process.env.RP_ID || (NODE_ENV === 'production' ? undefined : 'localhost');
const RP_NAME = process.env.RP_NAME || 'Passkeys Demo';
const EXPECTED_ORIGIN = process.env.EXPECTED_ORIGIN || CORS_ORIGIN;

// Database connection
const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for development
  })
);

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// In-memory storage for challenges (in production, use Redis or similar)
const challenges = new Map();

// Challenge cleanup - remove challenges older than 5 minutes
const CHALLENGE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const challengeTimestamps = new Map();

function cleanupExpiredChallenges() {
  const now = Date.now();
  for (const [key, timestamp] of challengeTimestamps) {
    if (now - timestamp > CHALLENGE_TIMEOUT) {
      challenges.delete(key);
      challengeTimestamps.delete(key);
    }
  }
}

// Clean up expired challenges every minute
setInterval(cleanupExpiredChallenges, 60 * 1000);

// Helper function to store challenge with timestamp
function storeChallenge(key, challenge) {
  challenges.set(key, challenge);
  challengeTimestamps.set(key, Date.now());
}

// Helper function to get and remove challenge
function getAndRemoveChallenge(key) {
  const challenge = challenges.get(key);
  if (challenge) {
    challenges.delete(key);
    challengeTimestamps.delete(key);
  }
  return challenge;
}

// Helper functions
async function getUserByUsername(username) {
  const result = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [
    username,
  ]);
  return result.rows[0];
}

async function createUser(username) {
  const result = await pool.query(
    'INSERT INTO users (username) VALUES ($1) RETURNING *',
    [username.toLowerCase()]
  );
  return result.rows[0];
}

async function saveCredential(userId, credentialId, publicKey, rawId, rpId) {
  await pool.query(
    `INSERT INTO passkey_credentials (id, user_id, raw_id, public_key, rp_id) 
     VALUES ($1, $2, $3, $4, $5)`,
    [credentialId, userId, rawId, publicKey, rpId]
  );
}

async function getCredentialsByUserId(userId) {
  const result = await pool.query(
    'SELECT * FROM passkey_credentials WHERE user_id = $1',
    [userId]
  );
  return result.rows;
}

async function getCredentialById(credentialId) {
  const result = await pool.query(
    `SELECT pc.*, u.username 
     FROM passkey_credentials pc 
     JOIN users u ON pc.user_id = u.id 
     WHERE pc.id = $1`,
    [credentialId]
  );
  return result.rows[0];
}

async function updateCredentialCounter(credentialId, counter) {
  await pool.query(
    'UPDATE passkey_credentials SET counter = $1, last_used_at = CURRENT_TIMESTAMP WHERE id = $2',
    [counter, credentialId]
  );
}

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Username validation constants
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const RESERVED_USERNAMES = [
  'admin',
  'administrator',
  'root',
  'user',
  'test',
  'demo',
  'api',
  'www',
  'mail',
  'email',
  'support',
  'help',
  'info',
  'contact',
  'service',
  'system',
  'null',
  'undefined',
  'guest',
  'anonymous',
];

// Validate username helper
function validateUsername(username) {
  const errors = [];

  if (!username || !username.trim()) {
    errors.push('Username is required');
    return { isValid: false, errors };
  }

  const trimmedUsername = username.trim();

  // Check length
  if (trimmedUsername.length < USERNAME_MIN_LENGTH) {
    errors.push(
      `Username must be at least ${USERNAME_MIN_LENGTH} characters long`
    );
  }

  if (trimmedUsername.length > USERNAME_MAX_LENGTH) {
    errors.push(
      `Username must be no more than ${USERNAME_MAX_LENGTH} characters long`
    );
  }

  // Check pattern
  if (!USERNAME_PATTERN.test(trimmedUsername)) {
    errors.push(
      'Username can only contain letters, numbers, underscores, and hyphens'
    );
  }

  // Check for reserved usernames
  if (RESERVED_USERNAMES.includes(trimmedUsername.toLowerCase())) {
    errors.push('This username is reserved and cannot be used');
  }

  // Check for consecutive special characters
  if (/[_-]{2,}/.test(trimmedUsername)) {
    errors.push('Username cannot contain consecutive underscores or hyphens');
  }

  // Check if starts or ends with special characters
  if (/^[_-]|[_-]$/.test(trimmedUsername)) {
    errors.push('Username cannot start or end with underscores or hyphens');
  }

  // Check for confusing patterns
  if (/^[0-9]+$/.test(trimmedUsername)) {
    errors.push('Username cannot be only numbers');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Check username availability
app.post('/api/check-username', async (req, res) => {
  try {
    const { username } = req.body;

    // First validate the username format
    const validation = validateUsername(username);
    if (!validation.isValid) {
      return res.status(400).json({
        available: false,
        errors: validation.errors,
      });
    }

    // Check if username already exists
    const existingUser = await getUserByUsername(username.trim());
    const available = !existingUser;

    res.json({
      available,
      username: username.trim(),
      errors: available ? [] : ['Username is already taken'],
    });
  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({
      available: false,
      errors: ['Failed to check username availability'],
    });
  }
});

// Generate registration options
app.post('/api/register/begin', async (req, res) => {
  try {
    const { username } = req.body;

    // Validate username before proceeding
    const validation = validateUsername(username);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid username: ' + validation.errors.join(', '),
      });
    }

    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Check if user already exists
    let user = await getUserByUsername(username);
    if (!user) {
      user = await createUser(username);
    }

    // Get existing credentials to exclude them
    const existingCredentials = await getCredentialsByUserId(user.id);
    const excludeCredentials = existingCredentials.map((cred) => ({
      id: base64url.toBuffer(cred.id),
      type: 'public-key',
    }));

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: isoUint8Array.fromUTF8String(user.id.toString()),
      userName: username,
      userDisplayName: username,
      attestationType: 'none',
      excludeCredentials: excludeCredentials,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
      },
      supportedAlgorithmIDs: [-7, -257], // ES256, RS256
    });

    // Store challenge for verification
    storeChallenge(username.toLowerCase(), options.challenge);

    // Send raw options for SimpleWebAuthn browser library
    console.log('=== DETAILED REGISTRATION OPTIONS ===');
    console.log(
      'Challenge:',
      options.challenge,
      'Type:',
      typeof options.challenge
    );
    console.log('User ID:', options.user.id, 'Type:', typeof options.user.id);
    console.log(
      'User Name:',
      options.user.name,
      'Type:',
      typeof options.user.name
    );
    console.log(
      'User Display Name:',
      options.user.displayName,
      'Type:',
      typeof options.user.displayName
    );
    console.log('Full options object:', JSON.stringify(options, null, 2));
    console.log('=====================================');

    res.json(options);
  } catch (error) {
    console.error('Registration begin error:', error);
    res.status(500).json({ error: 'Failed to generate registration options' });
  }
});

// Verify registration
app.post('/api/register/complete', async (req, res) => {
  try {
    const { username, credential } = req.body;

    console.log('Registration complete - Username:', username);
    console.log('Registration complete - Credential received:', credential.id);

    if (!username || !credential) {
      return res
        .status(400)
        .json({ error: 'Username and credential are required' });
    }

    const expectedChallenge = getAndRemoveChallenge(username.toLowerCase());
    if (!expectedChallenge) {
      console.log('No challenge found for username:', username);
      return res.status(400).json({ error: 'Invalid or expired challenge' });
    }

    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Check if this credential already exists (prevent duplicates)
    const existingCredential = await getCredentialById(credential.id);
    if (existingCredential) {
      console.log('Credential already exists, skipping save');
      // Clean up challenge
      getAndRemoveChallenge(username.toLowerCase());

      return res.json({
        verified: true,
        credentialId: credential.id,
        username: user.username,
        message: 'Credential already registered',
      });
    }

    console.log('About to verify registration...');

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: expectedChallenge,
      expectedOrigin: EXPECTED_ORIGIN,
      expectedRPID: RP_ID,
    });

    console.log('Verification result:', verification.verified);

    if (verification.verified && verification.registrationInfo) {
      const { credentialPublicKey, credentialID } =
        verification.registrationInfo;

      console.log('=== REGISTRATION CREDENTIAL DEBUG ===');
      console.log('Browser sent credential.id:', credential.id);
      console.log('Verification credentialID (raw):', credentialID);
      console.log(
        'credentialID base64url encoded:',
        base64url.encode(credentialID)
      );
      console.log('====================================');

      // Double-check for duplicate before saving (race condition protection)
      const duplicateCheck = await getCredentialById(credential.id);
      if (duplicateCheck) {
        console.log('Credential created by another request, skipping save');
        // Clean up challenge
        getAndRemoveChallenge(username.toLowerCase());

        return res.json({
          verified: true,
          credentialId: credential.id,
          username: user.username,
          message: 'Credential already registered',
        });
      }

      // Save credential to database - DON'T double-encode, credentialID is already base64url
      await saveCredential(
        user.id,
        credential.id, // Use the original credential.id from browser (already base64url)
        credentialPublicKey,
        credentialID,
        RP_ID
      );

      // Clean up challenge
      getAndRemoveChallenge(username.toLowerCase());

      console.log('Registration successful for user:', username);

      res.json({
        verified: true,
        credentialId: credential.id,
        username: user.username,
      });
    } else {
      console.log('Verification failed');
      res.status(400).json({ error: 'Registration verification failed' });
    }
  } catch (error) {
    console.error('Registration complete error:', error);

    // Handle unique constraint violations gracefully
    if (error.code === '23505') {
      // PostgreSQL unique violation error code
      console.log('Unique constraint violation - credential already exists');
      console.log('Constraint detail:', error.detail);
      const { username } = req.body;

      // Clean up challenge
      getAndRemoveChallenge(username.toLowerCase());

      // Determine which constraint was violated
      let message = 'Credential already registered';
      if (error.constraint === 'unique_user_rp') {
        message = 'User already has a passkey for this service';
      } else if (error.constraint === 'unique_raw_id') {
        message = 'This passkey is already registered';
      }

      return res.json({
        verified: true,
        credentialId: req.body.credential?.id,
        username: username,
        message: message,
      });
    }

    res
      .status(500)
      .json({ error: 'Failed to verify registration: ' + error.message });
  }
});

// Generate authentication options
app.post('/api/authenticate/begin', async (req, res) => {
  try {
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: 'required',
    });

    // Store challenge for verification
    storeChallenge('auth_' + options.challenge, options.challenge);

    // Send raw options for SimpleWebAuthn browser library
    console.log(
      'Sending authentication options for SimpleWebAuthn browser:',
      options
    );
    res.json(options);
  } catch (error) {
    console.error('Authentication begin error:', error);
    res
      .status(500)
      .json({ error: 'Failed to generate authentication options' });
  }
});

// Verify authentication
app.post('/api/authenticate/complete', async (req, res) => {
  try {
    const { credential } = req.body;

    console.log('=== AUTHENTICATION DEBUG ===');
    console.log('Received credential:', credential);
    console.log('Credential ID:', credential.id);
    console.log('Credential rawId:', credential.rawId);

    if (!credential) {
      return res.status(400).json({ error: 'Credential is required' });
    }

    // Try looking up the credential using the credential.id directly first
    console.log('Looking up credential by ID:', credential.id);
    let storedCredential = await getCredentialById(credential.id);

    if (!storedCredential) {
      console.log('Not found by ID, trying rawId conversion...');
      // Decode rawId to find stored credential
      const rawIdBuffer = base64url.toBuffer(credential.rawId);
      const credentialId = base64url.encode(rawIdBuffer);
      console.log('Converted rawId to:', credentialId);
      storedCredential = await getCredentialById(credentialId);
    }

    console.log('Found stored credential:', storedCredential ? 'YES' : 'NO');
    if (storedCredential) {
      console.log('Stored credential ID:', storedCredential.id);
      console.log('Stored credential username:', storedCredential.username);
    }

    if (!storedCredential) {
      console.log('=== CREDENTIAL NOT FOUND - DEBUGGING ===');
      // Let's see what credentials are actually in the database
      const allCredentials = await pool.query(
        'SELECT id, user_id FROM passkey_credentials LIMIT 10'
      );
      console.log('All credentials in DB:', allCredentials.rows);
      console.log('=====================================');
      return res.status(400).json({ error: 'Credential not found' });
    }

    // Parse clientDataJSON to get challenge
    const clientDataJSON = JSON.parse(
      Buffer.from(
        base64url.toBuffer(credential.response.clientDataJSON)
      ).toString('utf8')
    );

    const expectedChallenge = getAndRemoveChallenge(
      'auth_' + clientDataJSON.challenge
    );
    if (!expectedChallenge) {
      return res.status(400).json({ error: 'Invalid or expired challenge' });
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: expectedChallenge,
      expectedOrigin: EXPECTED_ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: base64url.toBuffer(storedCredential.id),
        credentialPublicKey: storedCredential.public_key,
        counter: storedCredential.counter,
      },
    });

    if (verification.verified) {
      // Update counter
      await updateCredentialCounter(
        storedCredential.id,
        verification.authenticationInfo.newCounter
      );

      // Clean up challenge
      getAndRemoveChallenge('auth_' + clientDataJSON.challenge);

      res.json({
        verified: true,
        username: storedCredential.username,
      });
    } else {
      res.status(400).json({ error: 'Authentication verification failed' });
    }
  } catch (error) {
    console.error('Authentication complete error:', error);
    res.status(500).json({ error: 'Failed to verify authentication' });
  }
});

// Get user credentials (for debugging)
app.get('/api/users/:username/credentials', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await getUserByUsername(username);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const credentials = await getCredentialsByUserId(user.id);
    res.json({
      credentials: credentials.map((c) => ({
        id: c.id,
        rpId: c.rp_id,
        counter: c.counter,
        createdAt: c.created_at,
        lastUsedAt: c.last_used_at,
      })),
    });
  } catch (error) {
    console.error('Get credentials error:', error);
    res.status(500).json({ error: 'Failed to get credentials' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`[SERVER] Passkeys backend server running on port ${PORT}`);
  console.log(`[DATABASE] ${DATABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log(`[CORS] Origin: ${CORS_ORIGIN}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing HTTP server...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing HTTP server...');
  await pool.end();
  process.exit(0);
});
 