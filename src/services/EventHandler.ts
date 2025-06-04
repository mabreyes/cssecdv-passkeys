export interface EventCallbacks {
  onRegister: () => void;
  onLogin: () => void;
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
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (target.id === 'register-btn') {
        this.callbacks.onRegister();
      } else if (target.id === 'login-btn') {
        this.callbacks.onLogin();
      } else if (target.id === 'logout-btn') {
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
  }
}
