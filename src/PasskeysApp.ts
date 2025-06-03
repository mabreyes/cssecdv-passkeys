import { AuthService } from './services/AuthService.js';
import { StateManager } from './services/StateManager.js';
import { MessageService } from './services/MessageService.js';
import { UIRenderer } from './services/UIRenderer.js';
import { EventHandler } from './services/EventHandler.js';
import type { LoginState } from './services/StateManager.js';
import type { EventCallbacks } from './services/EventHandler.js';

export class PasskeysApp {
  private username: string = '';
  private isLoggedIn: boolean = false;
  // EventHandler is used for its side effects (setting up event listeners)
  private eventHandler!: EventHandler;

  constructor() {
    this.restoreLoginState();
    this.initializeEventHandler();
    this.init();
  }

  private restoreLoginState(): void {
    const state = StateManager.restore();
    if (state) {
      this.isLoggedIn = state.isLoggedIn;
      this.username = state.username || '';
    }
  }

  private saveLoginState(): void {
    const state: LoginState = {
      isLoggedIn: this.isLoggedIn,
      username: this.username,
    };
    StateManager.save(state);
  }

  private initializeEventHandler(): void {
    const callbacks: EventCallbacks = {
      onRegister: () => this.handleRegister(),
      onLogin: () => this.handleLogin(),
      onLogout: () => this.handleLogout(),
    };
    // Store reference to keep event listeners active
    this.eventHandler = new EventHandler(callbacks);
    // Explicitly indicate this is used for side effects
    void this.eventHandler;
  }

  private init(): void {
    this.render();
    this.checkSupport();
  }

  private checkSupport(): void {
    if (!AuthService.checkSupport()) {
      MessageService.show('WebAuthn is not supported in this browser', 'error');
      return;
    }
    MessageService.show(
      'WebAuthn is supported! You can use passkeys.',
      'success'
    );
  }

  private render(): void {
    try {
      UIRenderer.render(this.isLoggedIn, this.username);
    } catch (error) {
      MessageService.show(`Render error: ${(error as Error).message}`, 'error');
    }
  }

  private async handleRegister(): Promise<void> {
    try {
      const username = UIRenderer.getUsernameInput();
      if (!username) {
        MessageService.show('Please enter a username', 'error');
        return;
      }

      MessageService.show('Creating passkey...', 'info');

      await AuthService.register(username);

      this.username = username;
      this.isLoggedIn = true;
      this.saveLoginState();

      MessageService.show('Passkey created successfully!', 'success');
      this.render();
    } catch (error) {
      MessageService.show(
        `Registration failed: ${(error as Error).message}`,
        'error'
      );
    }
  }

  private async handleLogin(): Promise<void> {
    try {
      MessageService.show('Authenticating with passkey...', 'info');

      const username = await AuthService.login();

      this.username = username;
      this.isLoggedIn = true;
      this.saveLoginState();

      MessageService.show('Login successful!', 'success');
      this.render();
    } catch (error) {
      MessageService.show(`Login failed: ${(error as Error).message}`, 'error');
    }
  }

  private handleLogout(): void {
    this.isLoggedIn = false;
    this.username = '';
    this.saveLoginState();

    MessageService.show('Logged out successfully', 'info');
    this.render();
  }
}
