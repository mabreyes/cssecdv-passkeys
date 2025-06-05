# 🔐 Passkeys Authentication Demo

![Demo](demo.gif)

A modern, secure, full-stack passkeys authentication system with real-time username validation, PostgreSQL persistence, and comprehensive Docker setup. Built with Vite, TypeScript, and Express.js.

**🌐 Live Demo:** [https://passkeys.marcr.xyz](https://passkeys.marcr.xyz)  
**📝 Author:** Marc Reyes ([hi@marcr.xyz](mailto:hi@marcr.xyz))

## ✨ Features

### 🔒 **Security & Authentication**

- **Passwordless Authentication** - No passwords to remember, store, or breach
- **WebAuthn/FIDO2 Standard** - Industry-standard biometric authentication
- **Phishing Resistant** - Passkeys are cryptographically bound to domains
- **Device-Bound Security** - Private keys never leave your device
- **Challenge-Response Protocol** - Protection against replay attacks
- **Secure Session Management** - Redis-based sessions with HttpOnly cookies
- **Automatic Session Expiration** - 1-week maximum with server-side validation

### 🎯 **User Experience**

- **Real-time Username Validation** - Instant feedback with availability checking
- **Comprehensive Validation Rules** - Length, format, reserved names, and uniqueness
- **Modern Material Design UI** - Beautiful, responsive interface
- **Cross-Platform Support** - Works on iOS, Android, macOS, Windows
- **Fast Performance** - Optimized with Vite and modern tooling

### 🏗️ **Architecture & Development**

- **Full-Stack Solution** - Frontend + Backend + Database + Redis Sessions
- **PostgreSQL Persistence** - Secure server-side credential storage
- **Redis Session Management** - 1-week session duration with automatic expiration
- **Docker Environment** - Complete development setup with one command
- **TypeScript Throughout** - Type safety across the entire stack
- **Production Ready** - Deployable with proper security headers

## 🔑 Redis Session Management

The application uses Redis for secure, scalable session management with the following features:

### Session Features

- **1-Week Duration** - Sessions automatically expire after 604,800,000 milliseconds (1 week)
- **Secure Cookies** - HttpOnly cookies with proper security settings prevent XSS attacks
- **Cross-Tab Sync** - Session state synchronized across browser tabs
- **Automatic Monitoring** - Frontend monitors session expiration and handles renewal
- **Server-Side Validation** - All API requests validate session server-side

### Configuration

The Redis session system is configured via environment variables in `docker-compose.yml`:

```yaml
environment:
  REDIS_URL: redis://redis:6379
  SESSION_SECRET: your-super-secret-session-key-change-in-production
  SESSION_MAX_AGE: 604800000 # 1 week in milliseconds
```

### Session API Endpoints

- `GET /api/auth/status` - Check current authentication status
- `GET /api/auth/me` - Get user profile and session information
- `POST /api/auth/logout` - Destroy session and logout

### Frontend Session Management

```typescript
import { sessionManager } from './services/SessionManager';

// Check authentication status
const isAuthenticated = sessionManager.isAuthenticated();
const session = sessionManager.getSession();

// Listen for session events
sessionManager.addEventListener((event) => {
  switch (event.type) {
    case 'login':
      console.log('User logged in');
      break;
    case 'logout':
      console.log('User logged out');
      break;
    case 'sessionExpired':
      console.log('Session expired, please log in again');
      break;
  }
});

// Authentication methods
await sessionManager.login();
await sessionManager.register('username');
await sessionManager.logout();
```

### Security Benefits

- **No localStorage** - Eliminates client-side tampering risks
- **Server-Side Validation** - Every request validates session authenticity
- **Automatic Cleanup** - Redis TTL ensures expired sessions are removed
- **HttpOnly Cookies** - Prevents XSS access to session data
- **CSRF Protection** - SameSite cookie attributes prevent CSRF attacks

## 🚀 Quick Start

### Option 1: Docker (Recommended)

**Complete development environment with database and session persistence:**

```bash
# Clone the repository
git clone https://github.com/mabreyes/cssecdv-passkeys
cd cssecdv-passkeys

# Start all services (Frontend + Backend + Database + Redis)
docker-compose up -d

# Wait for services to initialize (~30 seconds)
docker-compose logs -f

# Open your browser
open http://localhost:5173
```

### Option 2: Static Frontend Only

**For testing the UI with localStorage:**

```bash
# Clone and install
git clone https://github.com/mabreyes/cssecdv-passkeys
cd cssecdv-passkeys
npm install

# Start development server
npm run dev

# Open your browser
open http://localhost:5173
```

## 🏗️ Architecture Overview

### System Components

```mermaid
graph TB
    subgraph "Client Device"
        Frontend["`**Frontend**
        Port: 5173
        • Vite + TypeScript
        • Material Design UI
        • Real-time validation
        • WebAuthn client`"]

        Browser["`**Browser**
        • WebAuthn API
        • Biometric sensors
        • Secure storage`"]
    end

    subgraph "Server Infrastructure"
        Backend["`**Backend API**
        Port: 3000
        • Express.js
        • WebAuthn server
        • Rate limiting
        • CORS & Helmet`"]

        Database["`**PostgreSQL**
        Port: 5432
        • User accounts
        • Passkey credentials
        • Data persistence
        • Unique constraints`"]

        Redis["`**Redis**
        Port: 6379
        • Session storage
        • Challenge storage
        • 1-week TTL
        • Memory management`"]
    end

    Frontend <-->|HTTPS/API Calls| Backend
    Backend <-->|SQL Queries| Database
    Backend <-->|Session Storage| Redis
    Frontend -.->|WebAuthn| Browser

    style Frontend fill:#e1f5fe
    style Backend fill:#f3e5f5
    style Database fill:#e8f5e8
    style Redis fill:#ffcdd2
    style Browser fill:#fff3e0
```

### Frontend Architecture

```mermaid
graph TD
    subgraph "Frontend Services"
        AuthService["`**AuthService**
        • WebAuthn credential management
        • Registration & authentication
        • Challenge handling`"]

        ValidationService["`**ValidationService**
        • Real-time username validation
        • Availability checking
        • Rules enforcement`"]

        UIRenderer["`**UIRenderer**
        • Material Design components
        • Dynamic UI updates
        • State rendering`"]

        EventHandler["`**EventHandler**
        • User interactions
        • Input handling
        • Button clicks`"]

        MessageService["`**MessageService**
        • Toast notifications
        • Error messages
        • Success feedback`"]

        SessionManager["`**SessionManager**
        • Redis session management
        • Event-driven architecture
        • Automatic expiration monitoring
        • Session state synchronization`"]
    end

    subgraph "Main Application"
        PasskeysApp["`**PasskeysApp**
        Main orchestrator`"]
    end

    PasskeysApp --> AuthService
    PasskeysApp --> ValidationService
    PasskeysApp --> UIRenderer
    PasskeysApp --> EventHandler
    PasskeysApp --> MessageService
    PasskeysApp --> SessionManager

    EventHandler --> ValidationService
    ValidationService --> UIRenderer
    AuthService --> MessageService

    style PasskeysApp fill:#ffeb3b
    style AuthService fill:#4caf50
    style ValidationService fill:#2196f3
    style UIRenderer fill:#9c27b0
```

### API Flow Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant D as Database
    participant A as Authenticator

    Note over U,A: Registration Flow
    U->>F: Enter username
    F->>B: POST /api/check-username
    B->>D: Query username availability
    D-->>B: Available/Taken
    B-->>F: Validation result
    F-->>U: Real-time feedback

    U->>F: Click "Register"
    F->>B: POST /api/register/begin
    B->>D: Create/get user
    B-->>F: Challenge + options
    F->>A: navigator.credentials.create()
    A-->>F: New credential
    F->>B: POST /api/register/complete
    B->>D: Store credential
    B-->>F: Success
    F-->>U: Login automatically

    Note over U,A: Authentication Flow
    U->>F: Click "Login"
    F->>B: POST /api/authenticate/begin
    B-->>F: Challenge + options
    F->>A: navigator.credentials.get()
    A-->>F: Signed assertion
    F->>B: POST /api/authenticate/complete
    B->>D: Verify credential
    B-->>F: Success + user info
    F-->>U: Welcome back!
```

### Data Flow Architecture

```mermaid
flowchart LR
    subgraph "Input Layer"
        UI[User Input]
        Events[DOM Events]
    end

    subgraph "Validation Layer"
        RealTime[Real-time Validation]
        Debounce[Debounced API Calls]
        Rules[Validation Rules]
    end

    subgraph "Authentication Layer"
        WebAuthn[WebAuthn API]
        Challenges[Challenge Management]
        Crypto[Cryptographic Operations]
    end

    subgraph "Persistence Layer"
        State[State Management]
        LocalStore[Local Storage]
        Database[(PostgreSQL)]
    end

    UI --> Events
    Events --> RealTime
    RealTime --> Debounce
    Debounce --> Rules

    Events --> WebAuthn
    WebAuthn --> Challenges
    Challenges --> Crypto

    RealTime --> State
    WebAuthn --> State
    State --> LocalStore
    Challenges --> Database

    style UI fill:#e3f2fd
    style WebAuthn fill:#f3e5f5
    style Database fill:#e8f5e8
```

### Backend API Endpoints

```mermaid
graph LR
    subgraph "Authentication APIs"
        RegBegin["`**POST** /api/register/begin
        Initialize passkey registration`"]

        RegComplete["`**POST** /api/register/complete
        Complete passkey registration`"]

        AuthBegin["`**POST** /api/authenticate/begin
        Initialize passkey authentication`"]

        AuthComplete["`**POST** /api/authenticate/complete
        Complete passkey authentication`"]
    end

    subgraph "Validation APIs"
        CheckUser["`**POST** /api/check-username
        Real-time username validation`"]
    end

    subgraph "Utility APIs"
        Health["`**GET** /health
        Service health check`"]

        UserCreds["`**GET** /api/users/:user/creds
        List user credentials (debug)`"]
    end

    subgraph "Database Tables"
        Users[(users)]
        Credentials[(passkey_credentials)]
    end

    RegBegin --> Users
    RegComplete --> Credentials
    AuthBegin --> Credentials
    AuthComplete --> Credentials
    CheckUser --> Users
    UserCreds --> Credentials

    style RegBegin fill:#4caf50
    style RegComplete fill:#4caf50
    style AuthBegin fill:#2196f3
    style AuthComplete fill:#2196f3
    style CheckUser fill:#ff9800
```

## 🛠️ Development Setup

### Prerequisites

- **Node.js** 18+ and **npm** 8+
- **Docker & Docker Compose** (for full stack)
- **Modern browser** with WebAuthn support
- **Biometric device** (Face ID, Touch ID, Windows Hello) or security key

### Environment Configuration

The application automatically detects and adapts to different environments:

```javascript
// Automatic environment detection
const isDevelopment = window.location.hostname === 'localhost';
const rpId = isDevelopment ? 'localhost' : window.location.hostname;
const apiBase = isDevelopment
  ? 'http://localhost:3000'
  : window.location.origin;
```

### Database Schema

**Users Table:**

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Passkey Credentials Table:**

```sql
CREATE TABLE passkey_credentials (
    id VARCHAR(255) PRIMARY KEY,                    -- Base64URL credential ID
    user_id INTEGER NOT NULL REFERENCES users(id),  -- User reference
    raw_id BYTEA NOT NULL UNIQUE,                    -- Raw credential bytes
    public_key BYTEA NOT NULL,                       -- Public key for verification
    rp_id VARCHAR(255) NOT NULL,                     -- Relying party ID
    counter INTEGER DEFAULT 0,                       -- Signature counter
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_rp UNIQUE (user_id, rp_id) -- Prevent duplicates
);
```

## 🔧 Usage Guide

### Registration Flow

1. **Enter Username**

   - Must be 3-20 characters
   - Letters, numbers, underscores, hyphens only
   - Cannot start/end with special characters
   - Real-time availability checking

2. **Create Passkey**

   - Click "Register with Passkey"
   - Follow browser prompts for biometric authentication
   - Passkey is securely stored on your device

3. **Automatic Login**
   - Successfully registered users are automatically logged in

### Authentication Flow

1. **Start Login**

   - Click "Login with Passkey" (no username needed)
   - Browser presents available passkeys

2. **Authenticate**
   - Select your passkey
   - Complete biometric verification
   - Automatic login on success

### Username Validation Rules

```typescript
// Real-time validation includes:
✅ Length: 3-20 characters
✅ Pattern: /^[a-zA-Z0-9_-]+$/
✅ No consecutive special chars: no '__' or '--'
✅ No leading/trailing special chars
✅ Not numbers only
✅ Not reserved names (admin, root, api, etc.)
✅ Availability check against database
```

## 📝 Available Scripts

### Frontend Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run build:clean      # Clean build (removes dist/)
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format with Prettier
npm run format:check     # Check formatting
npm run type-check       # TypeScript type checking
npm run check-all        # Run all quality checks
```

### Docker Scripts

```bash
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose down -v            # Remove everything including data
docker-compose logs -f            # Follow all logs
docker-compose logs -f backend    # Backend logs only
docker-compose restart backend    # Restart backend service
docker-compose up -d --build      # Rebuild and start
```

### Database Management

```bash
# Connect to PostgreSQL
docker exec -it passkeys-postgres psql -U passkeys_user -d passkeys_db

# Clear all data (keep tables)
docker exec -i passkeys-postgres psql -U passkeys_user -d passkeys_db -c "DELETE FROM passkey_credentials; DELETE FROM users;"

# Check data counts
docker exec -i passkeys-postgres psql -U passkeys_user -d passkeys_db -c "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM passkey_credentials;"

# View users and credentials
docker exec -i passkeys-postgres psql -U passkeys_user -d passkeys_db -c "SELECT u.username, pc.id as cred_id, pc.created_at FROM users u LEFT JOIN passkey_credentials pc ON u.id = pc.user_id;"
```

## 🚀 Deployment

### Static Deployment (Render/Netlify/Vercel)

```bash
# Build the frontend
npm run build

# Deploy the dist/ folder
# Configure redirects for SPA routing
```

**Render.com Configuration:**

```yaml
# render.yaml
services:
  - type: web
    name: passkeys-frontend
    env: static
    buildCommand: npm ci && npm run build
    staticPublishPath: ./dist
```

### Full-Stack Deployment

For production deployment with backend:

1. **Environment Variables:**

```bash
DATABASE_URL=postgresql://user:pass@host:port/db
CORS_ORIGIN=https://yourdomain.com
RP_ID=yourdomain.com
RP_NAME=Your App Name
EXPECTED_ORIGIN=https://yourdomain.com
NODE_ENV=production
```

2. **Security Considerations:**

- Use HTTPS (required for WebAuthn)
- Implement proper rate limiting
- Use Redis for challenge storage
- Add comprehensive logging
- Set up monitoring and alerts

## 🧪 Testing & Quality

### Pre-commit Hooks (Husky)

Automatic quality checks on every commit:

```bash
# Pre-commit: Runs on staged files
- TypeScript type checking
- ESLint with auto-fix
- Prettier formatting

# Pre-push: Full project validation
- Complete type checking
- Linting without auto-fix
- Format verification
```

### Browser Compatibility

| Browser | Version | Support Level |
| ------- | ------- | ------------- |
| Chrome  | 67+     | ✅ Full       |
| Safari  | 14+     | ✅ Full       |
| Firefox | 60+     | ✅ Full       |
| Edge    | 18+     | ✅ Full       |

### Device Support

| Platform | Authentication Methods |
| -------- | ---------------------- |
| iOS      | Face ID, Touch ID      |
| Android  | Fingerprint, Face      |
| macOS    | Touch ID, Face ID      |
| Windows  | Windows Hello, PIN     |
| Linux    | Security Keys          |

## 🐛 Troubleshooting

### Common Issues

**"WebAuthn not supported"**

```bash
# Solutions:
- Use modern browser (Chrome 67+, Safari 14+, Firefox 60+)
- Ensure HTTPS in production or localhost in development
- Check if biometric authentication is set up on device
```

**Registration/Authentication fails**

```bash
# Debugging steps:
1. Check browser console for detailed errors
2. Verify device has biometric authentication enabled
3. Try incognito/private browsing mode
4. Clear browser data and retry
5. Check backend logs: docker-compose logs backend
```

**Database connection issues**

```bash
# Check PostgreSQL status
docker-compose ps postgres
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Reset database completely
docker-compose down -v && docker-compose up -d
```

**Session management issues**

```bash
# Check Redis status
docker-compose ps redis
docker-compose logs redis

# Test Redis connection
docker exec -it passkeys-redis redis-cli ping

# View active sessions
docker exec -it passkeys-redis redis-cli keys "sess:*"

# Monitor Redis commands
docker exec -it passkeys-redis redis-cli monitor

# Restart Redis
docker-compose restart redis
```

**Username validation not working**

```bash
# Check backend API
curl http://localhost:3000/api/check-username \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser"}'

# Expected response:
{"available":true,"username":"testuser","errors":[]}
```

### Debug Mode

Enable detailed logging by setting environment variables:

```bash
# Frontend debug (browser console)
localStorage.setItem('debug', 'passkeys:*');

# Backend debug
DEBUG=passkeys:* docker-compose up -d
```

## 📚 Technical Deep Dive

### WebAuthn Implementation

```typescript
// Registration Process
const publicKeyCredentialCreationOptions = {
  challenge: cryptoRandomChallenge,
  rp: { name: 'Passkeys Demo', id: rpId },
  user: { id: userIdBytes, name: username, displayName: username },
  pubKeyCredParams: [{ alg: -7, type: 'public-key' }], // ES256
  authenticatorSelection: {
    authenticatorAttachment: 'platform', // Prefer built-in authenticators
    userVerification: 'required', // Require biometric verification
    residentKey: 'preferred', // Support discoverable credentials
  },
  attestation: 'none', // No attestation required
};
```

### Security Features

- **Challenge-Response Authentication** - Unique challenges prevent replay attacks
- **Origin Binding** - Credentials are bound to specific domains
- **User Verification** - Biometric confirmation required for each use
- **Credential Isolation** - Each site gets unique credentials
- **Device Security** - Private keys protected by hardware security modules

### Performance Optimizations

- **Debounced Validation** - Username availability checks after 500ms delay
- **Efficient Re-rendering** - Only updates specific UI components, not entire DOM
- **Lazy Loading** - Services loaded on demand
- **Optimized Builds** - Tree shaking and code splitting with Vite

## 🤝 Contributing

### Development Workflow

1. **Fork and Clone**

   ```bash
   git clone https://github.com/yourusername/cssecdv-passkeys
   cd cssecdv-passkeys
   ```

2. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Development**

   ```bash
   # Start development environment
   docker-compose up -d

   # Make your changes
   # Tests will run automatically via git hooks
   ```

4. **Quality Checks**

   ```bash
   npm run check-all
   ```

5. **Submit PR**
   - Ensure all checks pass
   - Add tests for new features
   - Update documentation if needed

### Code Style

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for formatting
- **Conventional Commits** for clear history

## 📖 Learning Resources

### WebAuthn & Passkeys

- [WebAuthn Guide](https://webauthn.guide/) - Comprehensive guide
- [Passkeys.dev](https://passkeys.dev/) - Implementation resources
- [MDN WebAuthn API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- [FIDO Alliance](https://fidoalliance.org/) - Standards organization

### Libraries Used

- [SimpleWebAuthn](https://simplewebauthn.dev/) - WebAuthn implementation
- [Material Web Components](https://material-web.dev/) - UI components
- [Vite](https://vitejs.dev/) - Build tool and dev server
- [Express.js](https://expressjs.com/) - Backend framework

## ⚠️ Security Notes

### Development vs Production

**Development:**

- Uses hardcoded database credentials
- No SSL/TLS required (localhost exception)
- Session challenges stored in Redis
- Basic rate limiting
- Development session secret

**Production Requirements:**

- Environment-based configuration
- HTTPS mandatory for WebAuthn
- Strong Redis session secret
- Redis persistence configuration
- Comprehensive rate limiting
- Security headers and CSP
- Input validation and sanitization
- Proper error handling
- Session monitoring and audit logging

### Data Privacy

- **No biometric data storage** - Biometrics never leave the device
- **No password storage** - System is completely passwordless
- **Minimal user data** - Only username and credential metadata stored
- **Cryptographic security** - All authentication uses public key cryptography

## 📄 License & Credits

**MIT License** - See LICENSE file for details

**Built with ❤️ by [Marc Reyes](mailto:hi@marcr.xyz)**

### Acknowledgments

- WebAuthn working group for the standard
- SimpleWebAuthn team for the excellent library
- Material Design team for the components
- Vite team for the amazing build tool

---

**🌟 Star this project if you found it helpful!**  
**🐛 Report issues on [GitHub Issues](https://github.com/mabreyes/cssecdv-passkeys/issues)**  
**💬 Questions? Reach out at [hi@marcr.xyz](mailto:hi@marcr.xyz)**
