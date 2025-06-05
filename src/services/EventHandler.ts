/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
export interface EventCallbacks {
  onRegister: () => Promise<void>;
  onLogin: () => Promise<void>;
  onLogout: () => void;
  onUsernameInput: (event: Event) => void;
}

export class EventHandler {
  private callbacks: EventCallbacks;

  constructor(callbacks: EventCallbacks) {
    this.callbacks = callbacks;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Use event delegation since we're re-rendering the DOM
    document.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;

      if (target.id === 'register-btn') {
        e.preventDefault();
        e.stopPropagation();
        try {
          await this.callbacks.onRegister();
        } catch (error) {
          console.error('Register callback error:', error);
        }
      } else if (target.id === 'login-btn') {
        e.preventDefault();
        e.stopPropagation();
        try {
          await this.callbacks.onLogin();
        } catch (error) {
          console.error('Login callback error:', error);
        }
      } else if (target.id === 'logout-btn') {
        e.preventDefault();
        e.stopPropagation();
        this.callbacks.onLogout();
      }
    });

    // Listen for username input changes
    document.addEventListener('input', (e) => {
      const target = e.target as HTMLElement;

      if (target.id === 'username') {
        this.callbacks.onUsernameInput(e);
      }
    });

    // Prevent form submissions that might cause page refresh
    document.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Form submission prevented');
    });

    // Prevent any accidental form submissions from Enter key
    document.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;

        // If Enter is pressed in the username field, try to register (if valid)
        if (target.id === 'username') {
          e.preventDefault();
          const registerBtn = document.querySelector('#register-btn') as any;
          if (registerBtn && !registerBtn.hasAttribute('disabled')) {
            try {
              await this.callbacks.onRegister();
            } catch (error) {
              console.error('Register via Enter key error:', error);
            }
          }
        }
      }
    });
  }
}
