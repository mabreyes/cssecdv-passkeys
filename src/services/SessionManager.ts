import { AuthService } from './AuthService';
import type { UserSession, UserProfile } from './AuthService';

export type SessionEventType =
  | 'login'
  | 'logout'
  | 'sessionChange'
  | 'sessionExpired'
  | 'sessionInitialized';

export interface SessionEvent {
  type: SessionEventType;
  session: UserSession;
  profile?: UserProfile;
}

export class SessionManager {
  private session: UserSession = { authenticated: false };
  private profile: UserProfile | null = null;
  private listeners: Array<(event: SessionEvent) => void> = [];
  private checkInterval: number | null = null;
  private expirationTimeout: number | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeSession();
  }

  private async initializeSession() {
    try {
      console.log('Initializing session...');
      const session = await AuthService.checkAuthStatus();
      console.log('Initial session check result:', session);

      this.setSession(session, 'sessionChange');

      if (session.authenticated) {
        try {
          this.profile = await AuthService.getUserProfile();
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to get user profile:', error);
        }
      }

      this.setupSessionMonitoring();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize session:', error);
      this.setSession({ authenticated: false }, 'sessionChange');
    } finally {
      // Mark initialization as complete and emit event
      this.isInitialized = true;
      this.emit({
        type: 'sessionInitialized',
        session: this.session,
        profile: this.profile || undefined,
      });
      console.log('Session initialization completed');
    }
  }

  private setSession(newSession: UserSession, eventType: SessionEventType) {
    const wasAuthenticated = this.session.authenticated;
    this.session = newSession;

    // Clear profile if logged out
    if (!newSession.authenticated) {
      this.profile = null;
    }

    // Emit event
    this.emit({
      type: eventType,
      session: this.session,
      profile: this.profile || undefined,
    });

    // Setup session monitoring for authenticated sessions
    if (newSession.authenticated && !wasAuthenticated) {
      this.setupSessionMonitoring();
    } else if (!newSession.authenticated && wasAuthenticated) {
      this.clearSessionMonitoring();
    }
  }

  private setupSessionMonitoring() {
    this.clearSessionMonitoring();

    if (!this.session.authenticated || !this.session.expiresAt) {
      return;
    }

    const expirationTime = new Date(this.session.expiresAt).getTime();
    const now = Date.now();
    const timeUntilExpiration = expirationTime - now;

    if (timeUntilExpiration <= 0) {
      // Session already expired
      this.handleSessionExpiration();
      return;
    }

    // Set up timeout for session expiration
    this.expirationTimeout = window.setTimeout(() => {
      this.handleSessionExpiration();
    }, timeUntilExpiration);

    // Check session status periodically (every 5 minutes or 1 minute before expiration, whichever is sooner)
    const checkInterval = Math.min(
      300000,
      Math.max(timeUntilExpiration - 60000, 30000)
    );
    this.checkInterval = window.setInterval(() => {
      this.refreshSession();
    }, checkInterval);
  }

  private clearSessionMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.expirationTimeout) {
      clearTimeout(this.expirationTimeout);
      this.expirationTimeout = null;
    }
  }

  private handleSessionExpiration() {
    this.setSession({ authenticated: false }, 'sessionExpired');
  }

  private emit(event: SessionEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Session event listener error:', error);
      }
    });
  }

  // Public methods
  public addEventListener(listener: (event: SessionEvent) => void) {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public removeEventListener(listener: (event: SessionEvent) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  public getSession(): UserSession {
    return { ...this.session };
  }

  public getProfile(): UserProfile | null {
    return this.profile ? { ...this.profile } : null;
  }

  public isAuthenticated(): boolean {
    return this.session.authenticated;
  }

  public isSessionInitialized(): boolean {
    return this.isInitialized;
  }

  public async login(): Promise<string> {
    const username = await AuthService.login();

    // Immediately refresh session to get the proper session data with token
    // This should work now because AuthService stores the session token
    await this.refreshSession();

    return username;
  }

  public async register(username: string) {
    const result = await AuthService.register(username);

    // Immediately refresh session to get the proper session data with token
    // This should work now because AuthService stores the session token
    await this.refreshSession();

    return result;
  }

  public async logout(): Promise<void> {
    try {
      await AuthService.logout();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear session locally, even if API call fails
      this.setSession({ authenticated: false }, 'logout');
    }
  }

  public async refreshSession(): Promise<void> {
    try {
      console.log('Refreshing session...');
      const session = await AuthService.checkAuthStatus();
      console.log('Session refresh result:', session);

      this.setSession(session, 'sessionChange');

      if (session.authenticated) {
        try {
          this.profile = await AuthService.getUserProfile();
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to refresh user profile:', error);
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to refresh session:', error);
      this.setSession({ authenticated: false }, 'sessionChange');
    }
  }

  public getTimeUntilExpiration(): number | null {
    if (!this.session.authenticated || !this.session.expiresAt) {
      return null;
    }

    const expirationTime = new Date(this.session.expiresAt).getTime();
    const now = Date.now();
    return Math.max(0, expirationTime - now);
  }

  public formatTimeUntilExpiration(): string | null {
    const timeLeft = this.getTimeUntilExpiration();
    if (timeLeft === null || timeLeft <= 0) {
      return null;
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  }

  public destroy() {
    this.clearSessionMonitoring();
    this.listeners = [];
  }
}

// Create singleton instance
export const sessionManager = new SessionManager();
