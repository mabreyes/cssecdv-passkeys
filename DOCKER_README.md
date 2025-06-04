# 🐳 Docker Compose Setup for Passkeys with PostgreSQL

This Docker Compose setup allows you to test passkey authentication with PostgreSQL persistence, providing a complete development environment with database storage instead of localStorage.

## 🏗️ Architecture

The setup includes three services:

1. **PostgreSQL Database** - Stores user accounts and passkey credentials
2. **Backend API** - Express.js server with WebAuthn implementation
3. **Frontend** - Vite development server with updated AuthService

## 📋 Prerequisites

- Docker and Docker Compose installed
- Modern browser with WebAuthn support
- Device with biometric authentication (Face ID, Touch ID, Windows Hello) or security key

## 🚀 Quick Start

1. **Start all services:**

   ```bash
   docker-compose up -d
   ```

2. **Wait for services to be ready:**

   ```bash
   docker-compose logs -f
   ```

   Wait until you see:

   - `✅ PostgreSQL is ready to accept connections`
   - `🚀 Passkeys backend server running on port 3000`
   - `➜ Local: http://localhost:5173/`

3. **Open your browser** and navigate to `http://localhost:5173`

4. **Test the application:**
   - Register a new user with a passkey
   - Login with your passkey
   - Check database persistence

## 🔧 Service Details

### PostgreSQL Database

- **Port:** 5432
- **Database:** `passkeys_db`
- **Username:** `passkeys_user`
- **Password:** `passkeys_password`
- **Volume:** `postgres_data` for data persistence

### Backend API

- **Port:** 3000
- **Endpoints:**
  - `POST /api/register/begin` - Start passkey registration
  - `POST /api/register/complete` - Complete passkey registration
  - `POST /api/authenticate/begin` - Start passkey authentication
  - `POST /api/authenticate/complete` - Complete passkey authentication
  - `GET /api/users/:username/credentials` - List user credentials (debug)
  - `GET /health` - Health check

### Frontend

- **Port:** 5173
- **Environment:** Development mode with hot reload
- **API Integration:** Connected to backend at `http://localhost:3000`

## 📊 Database Schema

### Users Table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Passkey Credentials Table

```sql
CREATE TABLE passkey_credentials (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    raw_id BYTEA NOT NULL,
    public_key BYTEA NOT NULL,
    rp_id VARCHAR(255) NOT NULL,
    counter INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 🛠️ Development Commands

### Start all services:

```bash
docker-compose up -d
```

### View logs:

```bash
docker-compose logs -f
```

### Stop all services:

```bash
docker-compose down
```

### Rebuild services:

```bash
docker-compose up -d --build
```

### Remove everything (including volumes):

```bash
docker-compose down -v
```

### Access PostgreSQL directly:

```bash
docker-compose exec postgres psql -U passkeys_user -d passkeys_db
```

### View backend logs only:

```bash
docker-compose logs -f backend
```

### View frontend logs only:

```bash
docker-compose logs -f frontend
```

## 🔍 Debugging

### Check database contents:

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U passkeys_user -d passkeys_db

# List all users
SELECT * FROM users;

# List all credentials
SELECT id, user_id, rp_id, counter, created_at FROM passkey_credentials;

# Join users and credentials
SELECT u.username, pc.id as credential_id, pc.rp_id, pc.counter, pc.created_at
FROM users u
JOIN passkey_credentials pc ON u.id = pc.user_id;
```

### Test API endpoints:

```bash
# Health check
curl http://localhost:3000/health

# Get user credentials (after registering)
curl http://localhost:3000/api/users/testuser/credentials
```

### Common issues:

1. **Port conflicts:** Change ports in `docker-compose.yml` if 5173, 3000, or 5432 are in use
2. **WebAuthn errors:** Ensure you're using `localhost` and HTTPS is not required for development
3. **Database connection issues:** Check PostgreSQL logs with `docker-compose logs postgres`
4. **CORS errors:** Verify the frontend URL matches the CORS_ORIGIN in backend

## 📁 File Structure

```
.
├── docker-compose.yml          # Main Docker Compose configuration
├── Dockerfile.backend          # Backend service Dockerfile
├── Dockerfile.frontend         # Frontend service Dockerfile
├── docker/
│   └── init.sql               # PostgreSQL initialization script
├── backend/
│   ├── package.json           # Backend dependencies
│   └── server.js              # Express server with WebAuthn
└── src/services/
    └── AuthService.ts         # Updated frontend service
```

## 🔒 Security Notes

- This setup is for **development only**
- Uses hardcoded database credentials
- No SSL/TLS termination
- Challenges stored in memory (use Redis in production)
- No rate limiting beyond basic Express middleware

## 🚀 Production Considerations

For production deployment:

1. Use environment variables for sensitive data
2. Implement proper SSL/TLS
3. Use Redis or database for challenge storage
4. Add comprehensive logging and monitoring
5. Implement proper backup strategies
6. Use connection pooling for database
7. Add input validation and sanitization
8. Implement proper error handling and recovery

## 📚 Related Documentation

- [WebAuthn Guide](https://webauthn.guide/)
- [SimpleWebAuthn Library](https://simplewebauthn.dev/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Express.js Documentation](https://expressjs.com/)

## 🤝 Contributing

Feel free to improve this setup by:

1. Adding more comprehensive error handling
2. Implementing Redis for challenge storage
3. Adding automated tests
4. Improving security measures
5. Adding monitoring and health checks
