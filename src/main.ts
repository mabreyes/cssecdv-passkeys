import './style.css';

// Passkeys Authentication Demo
class PasskeysAuth {
  private username: string = '';
  private isLoggedIn: boolean = false;

  constructor() {
    this.restoreLoginState();
    this.init();
  }

  private restoreLoginState() {
    try {
      const loginState = localStorage.getItem('passkey_login_state');
      if (loginState) {
        const { isLoggedIn, username } = JSON.parse(loginState);
        this.isLoggedIn = isLoggedIn;
        this.username = username || '';
      }
    } catch (error) {
      console.error('Failed to restore login state:', error);
      // Clear corrupted data
      localStorage.removeItem('passkey_login_state');
    }
  }

  private saveLoginState() {
    try {
      const loginState = {
        isLoggedIn: this.isLoggedIn,
        username: this.username,
      };
      localStorage.setItem('passkey_login_state', JSON.stringify(loginState));
    } catch (error) {
      console.error('Failed to save login state:', error);
    }
  }

  private init() {
    this.render();
    this.setupEventListeners();
    this.checkSupport();
  }

  private checkSupport() {
    if (!window.PublicKeyCredential) {
      this.showMessage('WebAuthn is not supported in this browser', 'error');
      return;
    }
    this.showMessage('WebAuthn is supported! You can use passkeys.', 'success');
  }

  private getRpId(): string {
    // Get the current hostname for the RP ID
    const hostname = window.location.hostname;
    // For localhost, use 'localhost', for deployed sites use the actual domain
    return hostname === 'localhost' ? 'localhost' : hostname;
  }

  private render() {
    const app = document.querySelector<HTMLDivElement>('#app');
    if (!app) {
      this.showMessage('App container not found', 'error');
      return;
    }

    app.innerHTML = `
      <div class="container">
        <h1>🔐 Passkeys Login Demo</h1>
        <div class="card">
          ${this.isLoggedIn ? this.renderDashboard() : this.renderLogin()}
        </div>
        <div id="message" class="message"></div>
      </div>
    `;
  }

  private renderLogin() {
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

  private renderDashboard() {
    return `
      <div class="dashboard">
        <h2>Welcome back, ${this.username}! 🎉</h2>
        <p>You are successfully logged in with your passkey.</p>
        <button id="logout-btn" class="btn btn-secondary">Logout</button>
      </div>
    `;
  }

  private setupEventListeners() {
    // Use event delegation since we're re-rendering
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (target.id === 'register-btn') {
        this.register();
      } else if (target.id === 'login-btn') {
        this.login();
      } else if (target.id === 'logout-btn') {
        this.logout();
      }
    });
  }

  private async register() {
    try {
      const usernameInput =
        document.querySelector<HTMLInputElement>('#username');
      if (!usernameInput?.value.trim()) {
        this.showMessage('Please enter a username', 'error');
        return;
      }

      this.username = usernameInput.value.trim();
      this.showMessage('Creating passkey...', 'info');

      // Generate a random challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // User ID (should be unique and persistent)
      const userId = new TextEncoder().encode(this.username);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions =
        {
          challenge,
          rp: {
            name: 'Passkeys Demo',
            id: this.getRpId(),
          },
          user: {
            id: userId,
            name: this.username,
            displayName: this.username,
          },
          pubKeyCredParams: [
            {
              alg: -7, // ES256
              type: 'public-key',
            },
            {
              alg: -257, // RS256
              type: 'public-key',
            },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
          attestation: 'direct',
        };

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential;

      if (credential) {
        // Store credential info (in a real app, send to server)
        const credentialData = {
          id: credential.id,
          rawId: Array.from(new Uint8Array(credential.rawId)),
          username: this.username,
          rpId: this.getRpId(),
        };

        localStorage.setItem(
          'passkey_credential',
          JSON.stringify(credentialData)
        );
        this.showMessage('Passkey created successfully!', 'success');

        // Auto login after registration
        this.isLoggedIn = true;
        this.saveLoginState();
        this.render();
      }
    } catch (error) {
      this.showMessage(
        `Registration failed: ${(error as Error).message}`,
        'error'
      );
    }
  }

  private async login() {
    try {
      this.showMessage('Authenticating with passkey...', 'info');

      // Generate a random challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions =
        {
          challenge,
          userVerification: 'required',
          timeout: 60000,
        };

      const credential = (await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      })) as PublicKeyCredential;

      if (credential) {
        // Try to get username from stored credential if available
        const storedCredential = localStorage.getItem('passkey_credential');
        const username = storedCredential
          ? JSON.parse(storedCredential).username
          : 'User';

        this.username = username;
        this.isLoggedIn = true;
        this.showMessage('Login successful!', 'success');
        this.saveLoginState();
        this.render();
      }
    } catch (error) {
      this.showMessage(`Login failed: ${(error as Error).message}`, 'error');
    }
  }

  private logout() {
    this.isLoggedIn = false;
    this.username = '';
    this.showMessage('Logged out successfully', 'info');
    this.saveLoginState();
    this.render();
  }

  private showMessage(text: string, type: 'success' | 'error' | 'info') {
    const messageEl = document.querySelector('#message');
    if (messageEl) {
      messageEl.textContent = text;
      messageEl.className = `message ${type}`;

      // Clear message after 5 seconds
      setTimeout(() => {
        messageEl.textContent = '';
        messageEl.className = 'message';
      }, 5000);
    }
  }
}

// Initialize the app
new PasskeysAuth();
