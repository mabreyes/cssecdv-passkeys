# 🔐 Passkeys Authentication Demo

A modern, secure login demo using **Passkeys** (WebAuthn) for passwordless authentication built with Vite and TypeScript.

**Live Demo:** [https://passkeys.marcr.xyz](https://passkeys.marcr.xyz)

## ✨ Features

- 🔒 **Passwordless Authentication** - No passwords to remember or manage
- 🔑 **Passkeys Support** - Uses WebAuthn API for secure biometric authentication
- 📱 **Cross-Platform** - Works on devices with Face ID, Touch ID, Windows Hello, or security keys
- 🎨 **Modern UI** - Beautiful, responsive design with smooth animations
- ⚡ **Fast & Lightweight** - Built with Vite for optimal performance
- 🔐 **Secure** - Biometric data never leaves your device
- 🚀 **Production Ready** - Deployed on Render.com with proper security headers

## 🚀 Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm (version 8 or higher)
- A modern browser that supports WebAuthn
- A device with biometric authentication (Face ID, Touch ID, Windows Hello) or a security key

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/mabreyes/cssecdv-passkeys
   cd cssecdv-passkeys
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:5173`

## 🔧 How to Use

### First Time Setup (Registration)

1. **Enter a username** in the input field
2. **Click "Register with Passkey"**
3. **Follow your browser's prompts** to create a passkey using:
   - Face ID or Touch ID (on supported devices)
   - Windows Hello (on Windows)
   - Security key (USB/NFC)
4. **You're automatically logged in** after successful registration

### Returning Users (Login)

1. **Click "Login with Passkey"**
2. **Authenticate** using your registered biometric method
3. **Welcome back!** You're now logged in

### Logout

- **Click "Logout"** when you're done to end your session

## 🛠️ Technical Details

### WebAuthn API Usage

This demo implements the Web Authentication API (WebAuthn) with the following features:

- **Credential Creation** - Registers new passkeys with your device
- **Credential Authentication** - Verifies identity using stored passkeys
- **Platform Authenticators** - Prefers built-in biometric authentication
- **User Verification** - Requires biometric confirmation for security
- **Dynamic RP ID** - Automatically adapts to localhost and production domains

### Security Features

- ✅ **No Password Storage** - Credentials are stored securely on your device
- ✅ **Phishing Resistant** - Passkeys are bound to specific domains
- ✅ **Replay Attack Protection** - Each authentication uses unique challenges
- ✅ **Device-Bound Security** - Private keys never leave your device
- ✅ **Security Headers** - Proper CSP and security headers in production
- ✅ **HTTPS Required** - WebAuthn requires secure connections

### Browser Support

This demo works on modern browsers that support WebAuthn:

- ✅ **Chrome/Edge** 67+ (Windows Hello, security keys)
- ✅ **Safari** 14+ (Face ID, Touch ID on macOS/iOS)
- ✅ **Firefox** 60+ (security keys, Windows Hello)

## 📁 Project Structure

```
src/
├── main.ts          # Main application logic and WebAuthn implementation
├── style.css        # Modern, responsive styling
└── vite-env.d.ts    # TypeScript environment definitions

public/              # Static assets
├── _redirects       # Render.com routing configuration
└── vite.svg         # Vite logo

.husky/              # Git hooks
├── pre-commit       # Runs lint-staged before commits
└── pre-push         # Runs all checks before push

index.html          # HTML entry point
package.json        # Dependencies and scripts
tsconfig.json       # TypeScript configuration
render.yaml         # Render.com deployment configuration
.eslintrc.json      # ESLint configuration
.prettierrc         # Prettier configuration
```

## 🔍 Code Highlights

### Passkey Registration

```typescript
const credential = await navigator.credentials.create({
  publicKey: {
    challenge: cryptoChallenge,
    rp: { name: 'Passkeys Demo', id: this.getRpId() },
    user: { id: userId, name: username, displayName: username },
    pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
    },
  },
});
```

### Passkey Authentication

```typescript
const credential = await navigator.credentials.get({
  publicKey: {
    challenge: cryptoChallenge,
    allowCredentials: [{ id: credentialId, type: 'public-key' }],
    userVerification: 'required',
  },
});
```

## 🚀 Building for Production

```bash
# Run all checks
npm run check-all

# Build the app
npm run build

# Preview the production build
npm run preview

# Clean build
npm run build:clean
```

## 🌐 Deployment on Render.com

This project is configured for easy deployment on Render.com:

### Automatic Deployment

1. **Fork/Clone** this repository
2. **Connect to Render.com** and create a new Static Site
3. **Use these settings:**
   - **Build Command:** `npm ci && npm run build`
   - **Publish Directory:** `./dist`
4. **Deploy!** The `render.yaml` file will handle the rest

### Manual Deployment

```bash
# Build for production
npm run build

# The dist/ folder contains your deployable assets
```

### Environment Configuration

The app automatically adapts to different environments:

- **Development:** Uses `localhost` for WebAuthn RP ID
- **Production:** Uses the actual domain for WebAuthn RP ID

## 🔧 Development Workflow

### Pre-commit Hooks

This project uses Husky for Git hooks:

- **Pre-commit:** Runs ESLint and Prettier on staged files
- **Pre-push:** Runs type checking, linting, and format checking

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run type-check   # Run TypeScript type checking
npm run check-all    # Run all checks
```

## 🤝 Contributing

Feel free to contribute by:

1. 🍴 Forking the repository
2. 🌿 Creating a feature branch
3. 💻 Making your improvements
4. 📝 Adding tests if applicable
5. ✅ Ensuring all checks pass (`npm run check-all`)
6. 🔄 Submitting a pull request

All code is automatically checked for:

- ✅ TypeScript type safety
- ✅ ESLint rules compliance
- ✅ Prettier formatting
- ✅ Git commit hooks

## 📚 Learn More

- [WebAuthn Guide](https://webauthn.guide/) - Comprehensive WebAuthn documentation
- [Passkeys.dev](https://passkeys.dev/) - Resources for implementing passkeys
- [Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API) - MDN documentation
- [Render.com Docs](https://render.com/docs) - Deployment documentation

## ⚠️ Important Notes

- This is a **demo application** for learning purposes
- In production, you should:
  - Implement proper server-side validation
  - Store credentials securely on the server
  - Add proper error handling and fallbacks
  - Implement additional security measures
  - Use a proper database instead of localStorage

## 🐛 Troubleshooting

### "WebAuthn is not supported"

- Use a modern browser (Chrome 67+, Safari 14+, Firefox 60+)
- Ensure you're on HTTPS or localhost

### Registration/Login Fails

- Check that your device supports biometric authentication
- Try using a security key as an alternative
- Clear browser data and try again
- Ensure you're on a secure connection (HTTPS)

### No Passkey Found

- Register first before attempting to login
- Check if you're using the same browser and device
- Passkeys are domain-specific - localhost vs production are different

### Deployment Issues

- Ensure Node.js version is 18+
- Check that build command completes successfully
- Verify `dist/` folder is created after build

---

**Built with ❤️ by Marc Reyes <hi@marcr.xyz>**  
**Using Vite, TypeScript, and WebAuthn**
