/* eslint-disable no-console */
import { AuthService } from './services/AuthService.js';
import { sessionManager } from './services/SessionManager.js';
import type { SessionEvent } from './services/SessionManager.js';
import { MessageService } from './services/MessageService.js';
import { UIRenderer } from './services/UIRenderer.js';
import { EventHandler } from './services/EventHandler.js';
import { SecurityService } from './services/SecurityService.js';
import {
  ValidationService,
  type ValidationResult,
} from './services/ValidationService.js';
import type { EventCallbacks } from './services/EventHandler.js';

export class PasskeysApp {
  private username: string = '';
  private isLoggedIn: boolean = false;
  private isRegistering: boolean = false;
  private isAuthenticating: boolean = false;
  private validationState: ValidationResult = { isValid: false, errors: [] };
  private isValidating: boolean = false;
  private validationTimeout: number | null = null;
  private isInitializing: boolean = true;
  // EventHandler is used for its side effects (setting up event listeners)
  private eventHandler!: EventHandler;
  private sessionUnsubscribe?: () => void;

  constructor() {
    this.setupGlobalErrorHandlers();
    this.initializeSessionManager();
    this.initializeEventHandler();
    SecurityService.initialize(); // Initialize security features
    this.init();
  }

  private setupGlobalErrorHandlers(): void {
    // Catch any unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault(); // Prevent browser default behavior

      let errorMessage = 'An unexpected error occurred';
      if (event.reason instanceof Error) {
        errorMessage = event.reason.message;
      } else if (typeof event.reason === 'string') {
        errorMessage = event.reason;
      }

      MessageService.show(
        `Unhandled error: ${errorMessage}. Please try again.`,
        'error'
      );
    });

    // Catch any unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('Unhandled JavaScript error:', event.error);

      let errorMessage = 'An unexpected error occurred';
      if (event.error instanceof Error) {
        errorMessage = event.error.message;
      } else if (typeof event.error === 'string') {
        errorMessage = event.error;
      }

      MessageService.show(
        `JavaScript error: ${errorMessage}. Please refresh the page if this persists.`,
        'error'
      );
    });
  }

  private initializeSessionManager(): void {
    // Set up session event listener
    this.sessionUnsubscribe = sessionManager.addEventListener(
      (event: SessionEvent) => {
        this.handleSessionEvent(event);
      }
    );

    // Initialize state from current session
    const session = sessionManager.getSession();
    if (session.authenticated) {
      this.isLoggedIn = true;
      this.username = session.username || '';
    } else {
      this.isLoggedIn = false;
      this.username = '';
    }
  }

  private handleSessionEvent(event: SessionEvent): void {
    console.log('Session event received:', event.type, event.session);

    switch (event.type) {
      case 'sessionInitialized':
        this.isInitializing = false;
        if (event.session.authenticated) {
          this.isLoggedIn = true;
          this.username = event.session.username || '';
        } else {
          this.isLoggedIn = false;
          this.username = '';
        }
        this.render();

        // Set up initial validation state and event handlers after rendering the real UI
        setTimeout(() => {
          this.updateRegisterButtonState();
          this.updateLoginButtonState();
          this.setupAutofillPrevention();
        }, 100);
        break;

      case 'login':
        this.isLoggedIn = true;
        this.username = event.session.username || '';
        MessageService.show('Login successful!', 'success');
        this.render();
        break;

      case 'logout':
        this.isLoggedIn = false;
        this.username = '';
        MessageService.show('Logged out successfully', 'info');
        this.render();
        break;

      case 'sessionExpired':
        this.isLoggedIn = false;
        this.username = '';
        MessageService.show(
          'Your session has expired. Please log in again.',
          'error'
        );
        this.render();
        break;

      case 'sessionChange':
        // Only handle sessionChange if not during initialization
        if (!this.isInitializing) {
          if (event.session.authenticated) {
            this.isLoggedIn = true;
            this.username = event.session.username || '';
          } else {
            this.isLoggedIn = false;
            this.username = '';
          }
          this.render();
        }
        break;
    }
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
    // Show loading state immediately
    this.renderLoadingState();
    this.checkSupport();

    // If session is already initialized (shouldn't happen but just in case)
    if (sessionManager.isSessionInitialized()) {
      this.isInitializing = false;
      this.render();

      // Set up initial validation state after render
      setTimeout(() => {
        this.updateRegisterButtonState();
        this.updateLoginButtonState();
        this.setupAutofillPrevention();
      }, 100);
    }
  }

  private setupAutofillPrevention(): void {
    const usernameInput = document.querySelector(
      '#username'
    ) as HTMLInputElement;
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
    const usernameInput = document.querySelector(
      '#username'
    ) as HTMLInputElement;
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
    const registerBtn = document.querySelector(
      '#register-btn'
    ) as HTMLButtonElement;
    if (!registerBtn) return;

    const usernameInput = document.querySelector(
      '#username'
    ) as HTMLInputElement;
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
    const loginBtn = document.querySelector('#login-btn') as HTMLButtonElement;
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

  private renderLoadingState(): void {
    const appElement = document.querySelector('#app');
    if (!appElement) return;

    appElement.innerHTML = `
      <div class="loading-container">
        <div class="loading-content">
          <div class="loading-spinner">
            <span class="material-symbols-rounded">refresh</span>
          </div>
          <h2>Loading Passkeys Demo</h2>
          <p>Checking authentication status...</p>
        </div>
      </div>
    `;
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

      await sessionManager.register(username);

      // Session state will be updated via session events
      // No need to manually update state here
      MessageService.show('Passkey created successfully!', 'success');
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error('Registration error:', errorMessage);

      // Provide specific guidance based on error type
      if (
        errorMessage.includes('cancelled') ||
        errorMessage.includes('denied')
      ) {
        MessageService.show(
          `${errorMessage} You must approve the passkey creation to complete registration.`,
          'error'
        );
      } else if (
        errorMessage.includes('already exists') ||
        errorMessage.includes('already taken')
      ) {
        MessageService.show(
          `${errorMessage} Please choose a different username or try logging in if you already have an account.`,
          'error'
        );
      } else if (errorMessage.includes('timed out')) {
        MessageService.show(
          `${errorMessage} The registration window expired - please try registering again and complete the verification promptly.`,
          'error'
        );
      } else if (errorMessage.includes('not supported')) {
        MessageService.show(
          `${errorMessage} Please ensure your device has biometric authentication enabled or try using a different browser.`,
          'error'
        );
      } else if (errorMessage.includes('Username validation failed')) {
        MessageService.show(
          `${errorMessage} Please fix the username issues shown above and try again.`,
          'error'
        );
      } else if (errorMessage.includes('session expired')) {
        MessageService.show(
          `${errorMessage} This can happen if you wait too long between steps.`,
          'error'
        );
      } else {
        // Generic error with suggestion
        MessageService.show(
          `${errorMessage} Please try again or refresh the page if the issue persists.`,
          'error'
        );
      }
    } finally {
      this.isRegistering = false; // Reset registration state
      this.render(); // Update UI to remove loading state

      // Re-establish validation state after render
      setTimeout(() => {
        this.updateValidationFeedback();
      }, 50);
    }
  }

  private showLoginGuidance(errorMessage: string): void {
    // Show additional helpful information for common login issues
    if (
      errorMessage.includes('No passkeys found') ||
      errorMessage.includes('not recognized')
    ) {
      // After a short delay, show additional guidance
      setTimeout(() => {
        MessageService.show(
          '<span class="material-symbols-rounded tip-icon">lightbulb</span> Tip: Passkeys are device-specific. If you registered on a different device, you\'ll need to register again on this device.',
          'info'
        );
      }, 3000);
    } else if (errorMessage.includes('cancelled')) {
      setTimeout(() => {
        MessageService.show(
          '<span class="material-symbols-rounded tip-icon">lightbulb</span> Tip: Make sure to complete the biometric verification (Face ID, Touch ID, Windows Hello) when prompted.',
          'info'
        );
      }, 3000);
    }
  }

  private async handleLogin(): Promise<void> {
    console.log('=== handleLogin called ===');

    // Prevent double login
    if (this.isAuthenticating) {
      console.log('Already authenticating, showing message');
      MessageService.show('Authentication already in progress...', 'info');
      return;
    }

    // Wrap everything in try-catch to ensure no errors escape
    try {
      console.log('Setting authentication state');
      this.isAuthenticating = true; // Set authentication state
      this.render(); // Update UI to show loading state

      // Re-establish button state after render
      setTimeout(() => {
        this.updateRegisterButtonState();
        this.updateLoginButtonState();
      }, 50);

      MessageService.show('Authenticating with passkey...', 'info');

      console.log('Calling sessionManager.login()');
      const username = await sessionManager.login();
      console.log('sessionManager.login() succeeded, username:', username);

      // Session state will be updated via session events
      // No need to manually update state here
      console.log('Login completed successfully');
    } catch (error) {
      console.log('=== LOGIN ERROR CAUGHT ===');
      console.error('Login error object:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);

      let errorMessage = 'Login failed due to an unknown error';

      if (error instanceof Error) {
        errorMessage = error.message;
        console.log('Error message:', errorMessage);
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage =
          (error as { message: string }).message || 'Unknown error object';
      } else if (error && typeof error === 'object') {
        errorMessage = error.toString() || 'Unknown error object';
      }

      console.log('Final error message to display:', errorMessage);

      // Provide specific guidance based on error type
      if (
        errorMessage.includes('No passkeys found') ||
        errorMessage.includes('not recognized')
      ) {
        MessageService.show(
          `${errorMessage} Try registering a new passkey first, or use a device where you've previously registered.`,
          'error'
        );
      } else if (
        errorMessage.includes('cancelled') ||
        errorMessage.includes('aborted')
      ) {
        MessageService.show(
          `${errorMessage} Click "Login with Passkey" and complete the biometric verification to proceed.`,
          'error'
        );
      } else if (errorMessage.includes('timed out')) {
        MessageService.show(
          `${errorMessage} The authentication window may have expired - please try again.`,
          'error'
        );
      } else if (errorMessage.includes('not supported')) {
        MessageService.show(
          `${errorMessage} You may need to enable biometric authentication on your device or use a security key.`,
          'error'
        );
      } else if (errorMessage.includes('session expired')) {
        MessageService.show(
          `${errorMessage} This can happen if you wait too long between steps.`,
          'error'
        );
      } else {
        // Generic error with suggestion
        MessageService.show(
          `${errorMessage} If this persists, try refreshing the page or registering a new passkey.`,
          'error'
        );
      }

      // Show additional guidance for common issues
      this.showLoginGuidance(errorMessage);
    } finally {
      console.log('Login finally block - resetting state');
      this.isAuthenticating = false; // Reset authentication state
      this.render(); // Update UI to remove loading state

      // Re-establish validation state after render
      setTimeout(() => {
        this.updateValidationFeedback();
      }, 50);
      console.log('=== handleLogin completed ===');
    }
  }

  private async handleLogout(): Promise<void> {
    try {
      await sessionManager.logout();
      // Session state will be updated via session events
      // No need to manually update state here
    } catch (error) {
      console.error('Logout error:', error);
      MessageService.show('Logout failed. Please try again.', 'error');
    }
  }

  // Cleanup method for proper resource management
  public destroy(): void {
    if (this.sessionUnsubscribe) {
      this.sessionUnsubscribe();
    }

    if (this.validationTimeout) {
      clearTimeout(this.validationTimeout);
    }
  }
}
