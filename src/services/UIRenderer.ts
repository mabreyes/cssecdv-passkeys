export class UIRenderer {
  static render(isLoggedIn: boolean, username: string): void {
    const app = document.querySelector<HTMLDivElement>('#app');
    if (!app) {
      throw new Error('App container not found');
    }

    app.innerHTML = `
      <div class="container">
        <div class="header">
          <h1>🔐 Passkeys Login Demo</h1>
          <a href="https://github.com/mabreyes/cssecdv-passkeys" target="_blank" rel="noopener noreferrer" class="github-link">
            <span class="material-symbols-rounded">code</span>
            View on GitHub
          </a>
        </div>
        <div id="message" class="message"></div>
        <div class="cards-layout">
          <div class="main-card">
            ${isLoggedIn ? this.renderDashboard(username) : this.renderLogin()}
          </div>
          <div class="info-detail-card">
            ${this.renderPasskeyInfo()}
          </div>
        </div>
        <footer class="footer">
          <p>Created by <strong>Marc Reyes</strong></p>
        </footer>
      </div>
    `;
  }

  private static renderLogin(): string {
    return `
      <div class="login-section">
        <h2>Welcome</h2>
        <p>Use passkeys for secure, passwordless authentication</p>
        
        <div class="form-group">
          <md-filled-text-field
            id="username"
            label="Username"
            placeholder="Enter your username"
            type="text">
          </md-filled-text-field>
        </div>
        
        <div class="button-group">
          <md-filled-button id="register-btn" class="primary-button">
            <span class="material-symbols-rounded" slot="icon">fingerprint</span>
            Register with Passkey
          </md-filled-button>
          <md-outlined-button id="login-btn" class="secondary-button">
            <span class="material-symbols-rounded" slot="icon">vpn_key</span>
            Login with Passkey
          </md-outlined-button>
        </div>
        
        <div class="info-card">
          <div class="info">
            <h3>How it works:</h3>
            <md-list>
              <md-list-item>
                <span class="material-symbols-rounded" slot="start">add_circle</span>
                <div slot="headline">Register: Create a new passkey for your account</div>
              </md-list-item>
              <md-list-item>
                <span class="material-symbols-rounded" slot="start">login</span>
                <div slot="headline">Login: Authenticate with any registered passkey on this device</div>
              </md-list-item>
              <md-list-item>
                <span class="material-symbols-rounded" slot="start">security</span>
                <div slot="headline">Secure: Your biometric data never leaves your device</div>
              </md-list-item>
            </md-list>
          </div>
        </div>
      </div>
    `;
  }

  private static renderDashboard(username: string): string {
    return `
      <div class="dashboard">
        <h2>Welcome back, ${username}! 🎉</h2>
        <p>You are successfully logged in with your passkey.</p>
        <md-outlined-button id="logout-btn" class="logout-button">
          <span class="material-symbols-rounded" slot="icon">logout</span>
          Logout
        </md-outlined-button>
      </div>
    `;
  }

  private static renderPasskeyInfo(): string {
    return `
      <div class="passkey-info">
        <h2>What are Passkeys?</h2>
        
        <div class="info-section">
          <h3><span class="material-symbols-rounded">shield</span>Passwordless Authentication</h3>
          <p>Passkeys replace passwords with cryptographic key pairs, eliminating the need to remember complex passwords or worry about password breaches.</p>
        </div>

        <div class="info-section">
          <h3><span class="material-symbols-rounded">fingerprint</span>Biometric Security</h3>
          <p>Use your device's built-in biometric sensors (Face ID, Touch ID, Windows Hello) or security keys for authentication. Your biometric data never leaves your device.</p>
        </div>

        <div class="info-section">
          <h3><span class="material-symbols-rounded">sync</span>Cross-Platform Sync</h3>
          <p>Passkeys sync across your devices through your platform's ecosystem (iCloud Keychain, Google Password Manager) making them available wherever you need them.</p>
        </div>

        <div class="info-section">
          <h3><span class="material-symbols-rounded">block</span>Phishing Resistant</h3>
          <p>Passkeys are bound to specific websites and cannot be tricked by phishing sites, providing superior protection against social engineering attacks.</p>
        </div>

        <div class="info-section">
          <h3><span class="material-symbols-rounded">public</span>Industry Standard</h3>
          <p>Built on WebAuthn and FIDO2 standards, passkeys are supported by major browsers and platforms including Apple, Google, Microsoft, and more.</p>
        </div>

        <div class="supported-platforms">
          <h3>Supported Platforms</h3>
          <div class="platform-grid">
            <div class="platform-item">
              <span class="material-symbols-rounded">phone_iphone</span>
              <span>iOS 16+</span>
            </div>
            <div class="platform-item">
              <span class="material-symbols-rounded">laptop_mac</span>
              <span>macOS 13+</span>
            </div>
            <div class="platform-item">
              <span class="material-symbols-rounded">android</span>
              <span>Android 9+</span>
            </div>
            <div class="platform-item">
              <span class="material-symbols-rounded">computer</span>
              <span>Windows 10+</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static getUsernameInput(): string {
    const usernameInput = document.querySelector<any>('#username');
    return usernameInput?.value.trim() || '';
  }
}
