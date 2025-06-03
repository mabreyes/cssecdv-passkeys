# 🔐 Passkeys Authentication Demo

A modern, secure login demo using **Passkeys** (WebAuthn) for passwordless authentication built with Vite and TypeScript.

## ✨ Features

- 🔒 **Passwordless Authentication** - No passwords to remember or manage
- 🔑 **Passkeys Support** - Uses WebAuthn API for secure biometric authentication
- 📱 **Cross-Platform** - Works on devices with Face ID, Touch ID, Windows Hello, or security keys
- 🎨 **Modern UI** - Beautiful, responsive design with smooth animations
- ⚡ **Fast & Lightweight** - Built with Vite for optimal performance
- 🔐 **Secure** - Biometric data never leaves your device

## 🚀 Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- A modern browser that supports WebAuthn
- A device with biometric authentication (Face ID, Touch ID, Windows Hello) or a security key

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to `http://localhost:5173`

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

### Security Features

- ✅ **No Password Storage** - Credentials are stored securely on your device
- ✅ **Phishing Resistant** - Passkeys are bound to specific domains
- ✅ **Replay Attack Protection** - Each authentication uses unique challenges
- ✅ **Device-Bound Security** - Private keys never leave your device

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
index.html          # HTML entry point
package.json        # Dependencies and scripts
tsconfig.json       # TypeScript configuration
```

## 🔍 Code Highlights

### Passkey Registration

```typescript
const credential = await navigator.credentials.create({
  publicKey: {
    challenge: cryptoChallenge,
    rp: { name: "Passkeys Demo", id: "localhost" },
    user: { id: userId, name: username, displayName: username },
    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
    },
  },
});
```

### Passkey Authentication

```typescript
const credential = await navigator.credentials.get({
  publicKey: {
    challenge: cryptoChallenge,
    allowCredentials: [{ id: credentialId, type: "public-key" }],
    userVerification: "required",
  },
});
```

## 🚀 Building for Production

```bash
# Build the app
npm run build

# Preview the production build
npm run preview
```

## 🤝 Contributing

Feel free to contribute by:

1. 🍴 Forking the repository
2. 🌿 Creating a feature branch
3. 💻 Making your improvements
4. 📝 Adding tests if applicable
5. 🔄 Submitting a pull request

## 📚 Learn More

- [WebAuthn Guide](https://webauthn.guide/) - Comprehensive WebAuthn documentation
- [Passkeys.dev](https://passkeys.dev/) - Resources for implementing passkeys
- [Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API) - MDN documentation

## ⚠️ Important Notes

- This is a **demo application** for learning purposes
- In production, you should:
  - Implement proper server-side validation
  - Store credentials securely on the server
  - Add proper error handling and fallbacks
  - Implement additional security measures

## 🐛 Troubleshooting

### "WebAuthn is not supported"
- Use a modern browser (Chrome 67+, Safari 14+, Firefox 60+)
- Ensure you're on HTTPS or localhost

### Registration/Login Fails
- Check that your device supports biometric authentication
- Try using a security key as an alternative
- Clear browser data and try again

### No Passkey Found
- Register first before attempting to login
- Check if you're using the same browser and device

---

**Built with ❤️ using Vite, TypeScript, and WebAuthn** 