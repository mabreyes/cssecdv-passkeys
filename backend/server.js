import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pg from 'pg';
import dotenv from 'dotenv';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
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
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  'your-super-secret-session-key-change-in-production';
const SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE) || 604800000; // 1 week in milliseconds
const RP_ID =
  process.env.RP_ID || (NODE_ENV === 'production' ? undefined : 'localhost');
const RP_NAME = process.env.RP_NAME || 'Passkeys Demo';
const EXPECTED_ORIGIN = process.env.EXPECTED_ORIGIN || CORS_ORIGIN;

// Database connection
const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Redis connection
const redisClient = createClient({
  url: REDIS_URL,
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

await redisClient.connect();

// Test Redis connection
try {
  await redisClient.ping();
  console.log('Redis connection verified');
} catch (error) {
  console.error('Redis connection test failed:', error);
  console.warn('Challenge storage may not work properly');
}

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for development
  })
);

// Session configuration with Redis store
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: 'passkeys.sid',
    cookie: {
      secure: NODE_ENV === 'production', // Only send cookies over HTTPS in production
      httpOnly: true, // Prevent XSS attacks
      maxAge: SESSION_MAX_AGE, // 1 week
      sameSite: NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-origin in production
      domain: NODE_ENV === 'production' ? '.marcr.xyz' : undefined, // Allow subdomain sharing in production
    },
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

// Challenge storage using Redis with tokens (for cross-domain support)
const CHALLENGE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Helper function to store challenge with token
async function storeChallenge(challenge) {
  const token = uuidv4();
  const key = `challenge:${token}`;

  console.log('=== STORING CHALLENGE ===');
  console.log('Challenge token:', token);
  console.log('Challenge:', challenge);

  try {
    await redisClient.setEx(
      key,
      Math.floor(CHALLENGE_TIMEOUT / 1000),
      challenge
    );
    console.log('Challenge stored in Redis with token');
    return token;
  } catch (error) {
    console.error('Redis error storing challenge:', error);
    throw new Error('Failed to store challenge - Redis unavailable');
  }
}

// Helper function to get and validate challenge by token
async function getAndValidateChallenge(token) {
  console.log('=== RETRIEVING CHALLENGE ===');
  console.log('Challenge token:', token);

  if (!token) {
    console.log('No challenge token provided');
    return null;
  }

  const key = `challenge:${token}`;

  try {
    const challenge = await redisClient.get(key);
    console.log('Retrieved challenge:', challenge);

    if (!challenge) {
      console.log('No challenge found for token or expired');
      return null;
    }

    // Remove challenge after use (one-time use)
    await redisClient.del(key);
    console.log('Challenge retrieved and cleared from Redis');

    return challenge;
  } catch (error) {
    console.error('Redis error retrieving challenge:', error);
    // Return null instead of throwing to allow graceful degradation
    console.log('Returning null due to Redis error');
    return null;
  }
}

// Middleware to check if user is authenticated (supports both session cookies and tokens)
async function requireAuth(req, res, next) {
  // First try session cookie
  if (req.session.userId) {
    return next();
  }

  // If no session cookie, try session token
  const sessionToken =
    req.headers.authorization?.replace('Bearer ', '') ||
    req.body.sessionToken ||
    req.query.sessionToken;
  if (sessionToken) {
    const sessionData = await validateSessionToken(sessionToken);
    if (sessionData) {
      // Attach session data to request for use in route handlers
      req.sessionData = sessionData;
      return next();
    }
  }

  return res.status(401).json({
    error: 'Authentication required',
    message: 'Please log in to access this resource',
  });
}

// Helper function to create user session
function createUserSession(req, userId, username) {
  req.session.userId = userId;
  req.session.username = username;
  req.session.loginTime = Date.now();
  req.session.sessionId = uuidv4();
}

// Session token storage for cross-domain support
const SESSION_TOKEN_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds

// Helper function to create session token
async function createSessionToken(userId, username) {
  const token = uuidv4();
  const key = `session:${token}`;

  const sessionData = {
    userId: userId,
    username: username,
    loginTime: Date.now(),
    sessionId: uuidv4(),
  };

  console.log('=== CREATING SESSION TOKEN ===');
  console.log('Session token:', token);
  console.log('User ID:', userId);
  console.log('Username:', username);

  try {
    await redisClient.setEx(
      key,
      Math.floor(SESSION_TOKEN_TIMEOUT / 1000),
      JSON.stringify(sessionData)
    );
    console.log('Session token stored in Redis');
    return token;
  } catch (error) {
    console.error('Redis error storing session token:', error);
    throw new Error('Failed to create session token - Redis unavailable');
  }
}

// Helper function to validate session token
async function validateSessionToken(token) {
  console.log('=== VALIDATING SESSION TOKEN ===');
  console.log('Session token:', token);

  if (!token) {
    console.log('No session token provided');
    return null;
  }

  const key = `session:${token}`;

  try {
    const sessionDataStr = await redisClient.get(key);
    console.log('Retrieved session data:', sessionDataStr ? 'YES' : 'NO');

    if (!sessionDataStr) {
      console.log('No session found for token or expired');
      return null;
    }

    const sessionData = JSON.parse(sessionDataStr);
    console.log('Session data parsed:', sessionData);

    // Refresh token expiration
    await redisClient.setEx(
      key,
      Math.floor(SESSION_TOKEN_TIMEOUT / 1000),
      sessionDataStr
    );
    console.log('Session token expiration refreshed');

    return sessionData;
  } catch (error) {
    console.error('Redis error validating session token:', error);
    return null;
  }
}

// Helper function to delete session token
async function deleteSessionToken(token) {
  if (!token) return;

  const key = `session:${token}`;

  try {
    await redisClient.del(key);
    console.log('Session token deleted from Redis');
  } catch (error) {
    console.error('Redis error deleting session token:', error);
  }
}

// Helper function to destroy user session
function destroyUserSession(req) {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }
  });
}

// Helper functions
async function getUserByUsername(username) {
  const result = await pool.query(
    'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
    [username]
  );
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

    // Store challenge for verification and get token
    let challengeToken;
    try {
      challengeToken = await storeChallenge(options.challenge);
    } catch (error) {
      console.error('Failed to store challenge for registration:', error);
      return res.status(500).json({
        error:
          'Registration service temporarily unavailable. Please try again later.',
      });
    }

    // Send raw options for SimpleWebAuthn browser library with challenge token
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

    res.json({
      ...options,
      challengeToken: challengeToken, // Include the challenge token for the next request
    });
  } catch (error) {
    console.error('Registration begin error:', error);
    res.status(500).json({ error: 'Failed to generate registration options' });
  }
});

// Verify registration
app.post('/api/register/complete', async (req, res) => {
  try {
    const { username, credential, challengeToken } = req.body;

    console.log('Registration complete - Username:', username);
    console.log('Registration complete - Credential received:', credential.id);
    console.log('Registration complete - Challenge token:', challengeToken);

    if (!username || !credential || !challengeToken) {
      return res.status(400).json({
        error: 'Username, credential, and challenge token are required',
      });
    }

    const expectedChallenge = await getAndValidateChallenge(challengeToken);
    if (!expectedChallenge) {
      console.log('No challenge found for token:', challengeToken);
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

      // Create user session after successful registration
      createUserSession(req, user.id, user.username);

      // Create session token for cross-domain support
      let sessionToken;
      try {
        sessionToken = await createSessionToken(user.id, user.username);
      } catch (error) {
        console.error('Failed to create session token:', error);
        // Continue without token - fallback to regular session
      }

      console.log('Registration successful for user:', username);

      res.json({
        verified: true,
        credentialId: credential.id,
        username: user.username,
        sessionId: req.session.sessionId,
        sessionToken: sessionToken, // Include session token for frontend
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

      // Get user for session creation
      const user = await getUserByUsername(username);
      let sessionToken;
      if (user) {
        createUserSession(req, user.id, user.username);

        // Create session token for cross-domain support
        try {
          sessionToken = await createSessionToken(user.id, user.username);
        } catch (error) {
          console.error('Failed to create session token:', error);
          // Continue without token - fallback to regular session
        }
      }

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
        sessionId: req.session.sessionId,
        sessionToken: sessionToken, // Include session token for frontend
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

    // Store challenge for verification and get token
    let challengeToken;
    try {
      challengeToken = await storeChallenge(options.challenge);
    } catch (error) {
      console.error('Failed to store challenge for authentication:', error);
      return res.status(500).json({
        error:
          'Authentication service temporarily unavailable. Please try again later.',
      });
    }

    // Send raw options for SimpleWebAuthn browser library
    console.log(
      'Sending authentication options for SimpleWebAuthn browser:',
      options
    );
    res.json({
      ...options,
      challengeToken: challengeToken, // Include the challenge token for the next request
    });
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
    const { credential, challengeToken } = req.body;

    console.log('=== AUTHENTICATION DEBUG ===');
    console.log('Received credential:', credential);
    console.log('Credential ID:', credential.id);
    console.log('Credential rawId:', credential.rawId);
    console.log('Challenge token:', challengeToken);

    if (!credential || !challengeToken) {
      return res
        .status(400)
        .json({ error: 'Credential and challenge token are required' });
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

    const expectedChallenge = await getAndValidateChallenge(challengeToken);
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

      // Get user for session creation
      const user = await getUserByUsername(storedCredential.username);
      createUserSession(req, user.id, user.username);

      // Create session token for cross-domain support
      let sessionToken;
      try {
        sessionToken = await createSessionToken(user.id, user.username);
      } catch (error) {
        console.error('Failed to create session token:', error);
        // Continue without token - fallback to regular session
      }

      res.json({
        verified: true,
        username: storedCredential.username,
        sessionId: req.session.sessionId,
        sessionToken: sessionToken, // Include session token for frontend
      });
    } else {
      res.status(400).json({ error: 'Authentication verification failed' });
    }
  } catch (error) {
    console.error('Authentication complete error:', error);
    res.status(500).json({ error: 'Failed to verify authentication' });
  }
});

// Get current user session info
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    // Get user ID from either session cookie or session token
    const userId = req.session.userId || req.sessionData?.userId;
    const sessionId = req.session.sessionId || req.sessionData?.sessionId;
    const loginTime = req.session.loginTime || req.sessionData?.loginTime;

    const user = await pool.query(
      'SELECT id, username, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (!user.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate expiration based on session type
    const expiresAt = req.session.userId
      ? new Date(Date.now() + SESSION_MAX_AGE).toISOString()
      : new Date(loginTime + SESSION_TOKEN_TIMEOUT).toISOString();

    res.json({
      user: {
        id: user.rows[0].id,
        username: user.rows[0].username,
        createdAt: user.rows[0].created_at,
      },
      session: {
        sessionId: sessionId,
        loginTime: loginTime,
        expiresAt: expiresAt,
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Logout endpoint (supports both session cookies and tokens)
app.post('/api/auth/logout', async (req, res) => {
  let username = 'Unknown';

  // Handle session cookie logout
  if (req.session.userId) {
    username = req.session.username || 'Unknown';
    destroyUserSession(req);
  }

  // Handle session token logout
  const sessionToken =
    req.headers.authorization?.replace('Bearer ', '') || req.body.sessionToken;
  if (sessionToken) {
    const sessionData = await validateSessionToken(sessionToken);
    if (sessionData) {
      username = sessionData.username;
    }
    await deleteSessionToken(sessionToken);
  }

  res.json({
    message: 'Logged out successfully',
    username: username,
  });
});

// Check if user is authenticated (supports both session cookies and tokens)
app.get('/api/auth/status', async (req, res) => {
  // First try session cookie
  if (req.session.userId) {
    return res.json({
      authenticated: true,
      userId: req.session.userId,
      username: req.session.username,
      sessionId: req.session.sessionId,
      loginTime: req.session.loginTime,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE).toISOString(),
    });
  }

  // If no session cookie, try session token
  const sessionToken =
    req.headers.authorization?.replace('Bearer ', '') || req.query.sessionToken;
  if (sessionToken) {
    const sessionData = await validateSessionToken(sessionToken);
    if (sessionData) {
      return res.json({
        authenticated: true,
        userId: sessionData.userId,
        username: sessionData.username,
        sessionId: sessionData.sessionId,
        loginTime: sessionData.loginTime,
        expiresAt: new Date(
          sessionData.loginTime + SESSION_TOKEN_TIMEOUT
        ).toISOString(),
      });
    }
  }

  res.json({
    authenticated: false,
  });
});

// Get user credentials (for debugging)
app.get('/api/users/:username/credentials', requireAuth, async (req, res) => {
  try {
    const { username } = req.params;

    // Only allow users to see their own credentials
    if (req.session.username !== username) {
      return res.status(403).json({ error: 'Access denied' });
    }

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
  try {
    await pool.end();
    await redisClient.quit();
    console.log('Database and Redis connections closed');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing HTTP server...');
  try {
    await pool.end();
    await redisClient.quit();
    console.log('Database and Redis connections closed');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
});
