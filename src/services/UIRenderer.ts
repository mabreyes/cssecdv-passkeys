export class UIRenderer {
  static render(isLoggedIn: boolean, username: string): void {
    const app = document.querySelector<HTMLDivElement>('#app');
    if (!app) {
      throw new Error('App container not found');
    }

    app.innerHTML = `
      <div class="container">
        <h1>🔐 Passkeys Login Demo</h1>
        <div class="card">
          ${isLoggedIn ? this.renderDashboard(username) : this.renderLogin()}
        </div>
        <div id="message" class="message"></div>
      </div>
    `;
  }

  private static renderLogin(): string {
    return `
      <div class="login-section">
        <h2>Welcome</h2>
        <p>Use passkeys for secure, passwordless authentication</p>
        
        <div class="form-group">
          <label for="username">Username:</label>
          <input type="text" id="username" placeholder="Enter your username" />
        </div>
        
        <div class="button-group">
          <button id="register-btn" class="btn btn-primary">
            📝 Register with Passkey
          </button>
          <button id="login-btn" class="btn btn-secondary">
            🔑 Login with Passkey
          </button>
        </div>
        
        <div class="info">
          <h3>How it works:</h3>
          <ul>
            <li>Register: Create a new passkey for your account</li>
            <li>Login: Authenticate with any registered passkey on this device</li>
            <li>Secure: Your biometric data never leaves your device</li>
          </ul>
        </div>
      </div>
    `;
  }

  private static renderDashboard(username: string): string {
    return `
      <div class="dashboard">
        <h2>Welcome back, ${username}! 🎉</h2>
        <p>You are successfully logged in with your passkey.</p>
        <button id="logout-btn" class="btn btn-secondary">Logout</button>
      </div>
    `;
  }

  static getUsernameInput(): string {
    const usernameInput = document.querySelector<HTMLInputElement>('#username');
    return usernameInput?.value.trim() || '';
  }
}
