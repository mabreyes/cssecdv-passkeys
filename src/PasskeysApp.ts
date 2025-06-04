import { AuthService } from './services/AuthService.js';
import { StateManager } from './services/StateManager.js';
import { MessageService } from './services/MessageService.js';
import { UIRenderer } from './services/UIRenderer.js';
import { EventHandler } from './services/EventHandler.js';
import {
  ValidationService,
  type ValidationResult,
} from './services/ValidationService.js';
import type { LoginState } from './services/StateManager.js';
import type { EventCallbacks } from './services/EventHandler.js';

export class PasskeysApp {
  private username: string = '';
  private isLoggedIn: boolean = false;
  private isRegistering: boolean = false;
  private isAuthenticating: boolean = false;
  private validationState: ValidationResult = { isValid: false, errors: [] };
  private isValidating: boolean = false;
  private validationTimeout: number | null = null;
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
      onUsernameInput: (event: Event) => this.handleUsernameInput(event),
    };
    // Store reference to keep event listeners active
    this.eventHandler = new EventHandler(callbacks);
    // Explicitly indicate this is used for side effects
    void this.eventHandler;
  }

  private init(): void {
    this.render();
    this.checkSupport();

    // Set up initial validation state after render
    setTimeout(() => {
      this.updateRegisterButtonState();
      this.updateLoginButtonState();
      this.setupAutofillPrevention();
    }, 100);
  }

  private setupAutofillPrevention(): void {
    const usernameInput = document.querySelector('#username') as any;
    if (usernameInput) {
      // Remove readonly on focus to allow typing
      usernameInput.addEventListener('focus', () => {
        usernameInput.removeAttribute('readonly');
      });

      // Add readonly back on blur if empty to prevent autofill suggestions
      usernameInput.addEventListener('blur', () => {
        if (!usernameInput.value) {
          usernameInput.setAttribute('readonly', '');
        }
      });
    }
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

  private handleUsernameInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const username = target.value;

    // Clear previous timeout
    if (this.validationTimeout) {
      clearTimeout(this.validationTimeout);
    }

    // Immediate basic validation for fast feedback
    const basicValidation = ValidationService.validateUsername(username);
    this.validationState = basicValidation;
    this.updateValidationFeedback(); // Only update validation feedback, not entire UI

    // Debounced availability check (only if basic validation passes)
    if (basicValidation.isValid && username.trim().length >= 3) {
      this.isValidating = true;
      this.updateValidationFeedback();

      this.validationTimeout = window.setTimeout(async () => {
        try {
          const completeValidation =
            await ValidationService.validateUsernameComplete(username);
          this.validationState = completeValidation;
        } catch (error) {
          this.validationState = {
            isValid: false,
            errors: ['Failed to validate username'],
          };
        } finally {
          this.isValidating = false;
          this.updateValidationFeedback();
        }
      }, 500); // 500ms debounce
    } else if (!basicValidation.isValid) {
      this.isValidating = false;
      this.updateValidationFeedback();
    }
  }

  private updateValidationFeedback(): void {
    const formGroup = document.querySelector('.form-group');
    if (!formGroup) return;

    // Remove existing validation feedback
    const existingFeedback = formGroup.querySelector('.validation-feedback');
    if (existingFeedback) {
      existingFeedback.remove();
    }

    // Get current username value
    const usernameInput = document.querySelector('#username') as any;
    const hasValue = usernameInput && usernameInput.value.trim().length > 0;

    // Add new validation feedback if needed
    if (hasValue) {
      const feedbackHtml = this.renderValidationFeedback(
        this.validationState,
        this.isValidating
      );
      if (feedbackHtml) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = feedbackHtml;
        const feedbackElement = tempDiv.firstElementChild;
        if (feedbackElement) {
          formGroup.appendChild(feedbackElement);
        }
      }
    }

    // Update button state
    this.updateRegisterButtonState();
    this.updateLoginButtonState();
  }

  private renderValidationFeedback(
    validationState: ValidationResult,
    isValidating: boolean
  ): string {
    if (isValidating) {
      return `
        <div class="validation-feedback validating">
          <span class="material-symbols-rounded">hourglass_empty</span>
          <span>Checking availability...</span>
        </div>
      `;
    }

    if (validationState.isValid) {
      return `
        <div class="validation-feedback valid">
          <span class="material-symbols-rounded">check_circle</span>
          <span>Username is available!</span>
        </div>
      `;
    }

    if (validationState.errors.length > 0) {
      return `
        <div class="validation-feedback invalid">
          <span class="material-symbols-rounded">error</span>
          <div class="errors">
            ${validationState.errors.map((error) => `<div class="error-item">${error}</div>`).join('')}
          </div>
        </div>
      `;
    }

    return '';
  }

  private updateRegisterButtonState(): void {
    const registerBtn = document.querySelector('#register-btn') as any;
    if (!registerBtn) return;

    const usernameInput = document.querySelector('#username') as any;
    const hasValue = usernameInput && usernameInput.value.trim().length > 0;

    const shouldDisable =
      this.isRegistering ||
      this.isAuthenticating ||
      !this.validationState.isValid ||
      this.isValidating ||
      !hasValue;

    if (shouldDisable) {
      registerBtn.setAttribute('disabled', '');
    } else {
      registerBtn.removeAttribute('disabled');
    }

    // Update button content properly
    if (this.isRegistering) {
      registerBtn.innerHTML = `
        <span class="material-symbols-rounded" slot="icon">hourglass_empty</span>
        Creating Passkey...
      `;
    } else {
      registerBtn.innerHTML = `
        <span class="material-symbols-rounded" slot="icon">fingerprint</span>
        Register with Passkey
      `;
    }
  }

  private updateLoginButtonState(): void {
    const loginBtn = document.querySelector('#login-btn') as any;
    if (!loginBtn) return;

    const isLoading = this.isRegistering || this.isAuthenticating;

    if (isLoading) {
      loginBtn.setAttribute('disabled', '');
    } else {
      loginBtn.removeAttribute('disabled');
    }

    // Update button content properly
    if (this.isAuthenticating) {
      loginBtn.innerHTML = `
        <span class="material-symbols-rounded" slot="icon">hourglass_empty</span>
        Authenticating...
      `;
    } else {
      loginBtn.innerHTML = `
        <span class="material-symbols-rounded" slot="icon">vpn_key</span>
        Login with Passkey
      `;
    }
  }

  private render(): void {
    try {
      UIRenderer.render(this.isLoggedIn, this.username, {
        isRegistering: this.isRegistering,
        isAuthenticating: this.isAuthenticating,
      });
    } catch (error) {
      MessageService.show(`Render error: ${(error as Error).message}`, 'error');
    }
  }

  private async handleRegister(): Promise<void> {
    // Prevent double registration
    if (this.isRegistering) {
      MessageService.show('Registration already in progress...', 'info');
      return;
    }

    const username = UIRenderer.getUsernameInput();

    // Validate username before proceeding
    if (!username || !username.trim()) {
      MessageService.show('Please enter a username', 'error');
      return;
    }

    // Check final validation state
    if (!this.validationState.isValid) {
      MessageService.show(
        'Please fix the username errors before registering',
        'error'
      );
      return;
    }

    // Perform final validation check
    try {
      const finalValidation =
        await ValidationService.validateUsernameComplete(username);
      if (!finalValidation.isValid) {
        this.validationState = finalValidation;
        this.render();
        MessageService.show(
          'Username validation failed: ' + finalValidation.errors.join(', '),
          'error'
        );
        return;
      }
    } catch (error) {
      MessageService.show(
        'Failed to validate username. Please try again.',
        'error'
      );
      return;
    }

    try {
      this.isRegistering = true; // Set registration state
      this.render(); // Update UI to show loading state

      // Re-establish validation state after render
      setTimeout(() => {
        this.updateRegisterButtonState();
        this.updateLoginButtonState();
      }, 50);

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
    } finally {
      this.isRegistering = false; // Reset registration state
      this.render(); // Update UI to remove loading state

      // Re-establish validation state after render
      setTimeout(() => {
        this.updateValidationFeedback();
      }, 50);
    }
  }

  private async handleLogin(): Promise<void> {
    // Prevent double login
    if (this.isAuthenticating) {
      MessageService.show('Authentication already in progress...', 'info');
      return;
    }

    try {
      this.isAuthenticating = true; // Set authentication state
      this.render(); // Update UI to show loading state

      // Re-establish button state after render
      setTimeout(() => {
        this.updateRegisterButtonState();
        this.updateLoginButtonState();
      }, 50);

      MessageService.show('Authenticating with passkey...', 'info');

      const username = await AuthService.login();

      this.username = username;
      this.isLoggedIn = true;
      this.saveLoginState();

      MessageService.show('Login successful!', 'success');
      this.render();
    } catch (error) {
      MessageService.show(`Login failed: ${(error as Error).message}`, 'error');
    } finally {
      this.isAuthenticating = false; // Reset authentication state
      this.render(); // Update UI to remove loading state

      // Re-establish validation state after render
      setTimeout(() => {
        this.updateValidationFeedback();
      }, 50);
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
