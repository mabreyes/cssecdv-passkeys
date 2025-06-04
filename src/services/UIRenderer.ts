export class UIRenderer {
  static render(isLoggedIn: boolean, username: string): void {
    const app = document.querySelector<HTMLDivElement>('#app');
    if (!app) {
      throw new Error('App container not found');
    }

    app.innerHTML = `
      <div class="container">
        <h1>🔐 Passkeys Login Demo</h1>
        <div id="message" class="message"></div>
        <div class="main-card">
          ${isLoggedIn ? this.renderDashboard(username) : this.renderLogin()}
        </div>
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

  static getUsernameInput(): string {
    const usernameInput = document.querySelector<any>('#username');
    return usernameInput?.value.trim() || '';
  }
}
