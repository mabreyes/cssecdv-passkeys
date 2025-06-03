export interface LoginState {
  isLoggedIn: boolean;
  username: string;
}

export class StateManager {
  private static readonly STORAGE_KEY = 'passkey_login_state';

  static restore(): LoginState | null {
    try {
      const loginState = localStorage.getItem(this.STORAGE_KEY);
      if (loginState) {
        return JSON.parse(loginState);
      }
    } catch (error) {
      console.error('Failed to restore login state:', error);
      // Clear corrupted data
      localStorage.removeItem(this.STORAGE_KEY);
    }
    return null;
  }

  static save(state: LoginState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save login state:', error);
    }
  }

  static clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear login state:', error);
    }
  }
}
