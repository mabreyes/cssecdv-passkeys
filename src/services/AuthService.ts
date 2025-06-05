/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';

export interface CredentialData {
  id: string;
  rawId: number[];
  username: string;
  rpId: string;
}

export interface UserSession {
  authenticated: boolean;
  userId?: string;
  username?: string;
  sessionId?: string;
  loginTime?: number;
  expiresAt?: string;
}

export interface UserProfile {
  user: {
    id: string;
    username: string;
    createdAt: string;
  };
  session: {
    sessionId: string;
    loginTime: number;
    expiresAt: string;
  };
}

export class AuthService {
  private static readonly API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  private static readonly SESSION_TOKEN_KEY = 'passkeys_session_token';

  static checkSupport(): boolean {
    return !!window.PublicKeyCredential;
  }

  static getRpId(): string {
    const hostname = window.location.hostname;
    return hostname === 'localhost' ? 'localhost' : hostname;
  }

  // Session token management
  private static getSessionToken(): string | null {
    try {
      return localStorage.getItem(this.SESSION_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get session token from localStorage:', error);
      return null;
    }
  }

  private static setSessionToken(token: string): void {
    try {
      localStorage.setItem(this.SESSION_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save session token to localStorage:', error);
    }
  }

  private static removeSessionToken(): void {
    try {
      localStorage.removeItem(this.SESSION_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove session token from localStorage:', error);
    }
  }

  private static async apiCall(
    endpoint: string,
    method: string = 'GET',
    body?: object
  ) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add session token if available
    const sessionToken = this.getSessionToken();
    if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`;
    }

    const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
      method,
      headers,
      credentials: 'include', // Include cookies for session management
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `API error: ${response.status}`);
    }

    return await response.json();
  }

  // Session management methods
  static async checkAuthStatus(): Promise<UserSession> {
    try {
      return await this.apiCall('/api/auth/status');
    } catch (error) {
      console.error('Failed to check auth status:', error);
      return { authenticated: false };
    }
  }

  static async getUserProfile(): Promise<UserProfile> {
    return await this.apiCall('/api/auth/me');
  }

  static async logout(): Promise<void> {
    const sessionToken = this.getSessionToken();

    // Include session token in logout request if available
    const body = sessionToken ? { sessionToken } : undefined;

    await this.apiCall('/api/auth/logout', 'POST', body);

    // Remove session token from localStorage
    this.removeSessionToken();
  }

  static async register(username: string): Promise<CredentialData> {
    if (!username.trim()) {
      throw new Error('Username is required');
    }

    try {
      console.log('=== REGISTRATION START ===');
      console.log('WebAuthn supported:', this.checkSupport());

      if (!this.checkSupport()) {
        throw new Error(
          'WebAuthn is not supported in this browser. Please use a modern browser like Chrome, Safari, or Firefox.'
        );
      }

      // Get registration options from server
      let options;
      try {
        options = await this.apiCall('/api/register/begin', 'POST', {
          username: username.trim(),
        });
      } catch (error: any) {
        console.error('Server registration options error:', error);

        if (error.message?.includes('Invalid username')) {
          throw new Error(
            `Username validation failed: ${error.message.split(': ')[1] || 'Please check your username'}`
          );
        } else if (error.message?.includes('already exists')) {
          throw new Error(
            'This username is already taken. Please choose a different username.'
          );
        } else {
          throw new Error(
            `Failed to start registration: ${error.message || 'Server error occurred'}`
          );
        }
      }

      console.log('Registration options from server:', options);

      // Use SimpleWebAuthn browser library to handle registration
      let credential;
      try {
        credential = await startRegistration(options);
      } catch (error: any) {
        console.error('WebAuthn registration error:', error);

        // Handle specific WebAuthn errors
        if (error.name === 'NotAllowedError') {
          throw new Error(
            'Registration was cancelled or denied. Please try again and allow the passkey creation.'
          );
        } else if (error.name === 'InvalidStateError') {
          throw new Error(
            'A passkey for this account already exists on this device. Try logging in instead.'
          );
        } else if (error.name === 'NotSupportedError') {
          throw new Error(
            'Your device does not support passkey creation. Please try a different device or browser.'
          );
        } else if (error.name === 'SecurityError') {
          throw new Error(
            "Registration failed due to security restrictions. Please ensure you're on a secure connection."
          );
        } else if (error.name === 'AbortError') {
          throw new Error('Registration was aborted. Please try again.');
        } else if (error.name === 'ConstraintError') {
          throw new Error(
            'Device constraints prevent passkey creation. Please try a different authentication method.'
          );
        } else if (error.message?.includes('cancelled')) {
          throw new Error(
            'Registration was cancelled. Please try again and complete the biometric verification.'
          );
        } else if (error.message?.includes('timeout')) {
          throw new Error(
            'Registration timed out. Please try again and complete the verification promptly.'
          );
        } else {
          throw new Error(
            `Failed to create passkey: ${error.message || 'Unknown error occurred'}`
          );
        }
      }

      console.log('Credential created by SimpleWebAuthn browser:', credential);

      // Send to server for verification
      let verificationResult;
      try {
        verificationResult = await this.apiCall(
          '/api/register/complete',
          'POST',
          {
            username: username.trim(),
            credential: credential,
            challengeToken: options.challengeToken, // Include the challenge token
          }
        );
      } catch (error: any) {
        console.error('Server verification error:', error);

        if (error.message?.includes('Invalid or expired challenge')) {
          throw new Error(
            'Registration session expired. Please try registering again.'
          );
        } else if (error.message?.includes('already registered')) {
          throw new Error(
            'This passkey is already registered. Try logging in instead.'
          );
        } else if (error.message?.includes('verification failed')) {
          throw new Error(
            'Passkey verification failed. Please try registering again.'
          );
        } else {
          throw new Error(
            `Registration verification failed: ${error.message || 'Server error occurred'}`
          );
        }
      }

      if (!verificationResult.verified) {
        throw new Error(
          'Passkey registration could not be verified. Please try again.'
        );
      }

      // Store session token if provided
      if (verificationResult.sessionToken) {
        this.setSessionToken(verificationResult.sessionToken);
        console.log('Session token saved for cross-domain persistence');
      }

      console.log('Registration successful!');

      return {
        id: credential.id,
        rawId: [], // SimpleWebAuthn handles this internally
        username: username.trim(),
        rpId: this.getRpId(),
      };
    } catch (error) {
      console.error('Registration error:', error);

      // Re-throw with preserved message if it's already a user-friendly error
      if (error instanceof Error) {
        throw error;
      }

      // Fallback for unknown error types
      throw new Error(
        'Registration failed due to an unexpected error. Please try again.'
      );
    }
  }

  static async login(): Promise<string> {
    console.log('=== AuthService.login START ===');
    try {
      console.log('WebAuthn supported:', this.checkSupport());

      if (!this.checkSupport()) {
        const error = new Error(
          'WebAuthn is not supported in this browser. Please use a modern browser like Chrome, Safari, or Firefox.'
        );
        console.error('WebAuthn not supported:', error);
        throw error;
      }

      // Get authentication options from server
      console.log('Requesting authentication options...');
      const options = await this.apiCall('/api/authenticate/begin', 'POST');

      console.log('Authentication options from server:', options);

      // Use SimpleWebAuthn browser library to handle authentication
      let credential;
      try {
        console.log('Starting WebAuthn authentication...');
        credential = await startAuthentication(options);
        console.log('WebAuthn authentication completed successfully');
      } catch (error: any) {
        console.error('WebAuthn authentication error:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);

        // Handle specific WebAuthn errors
        if (error.name === 'NotAllowedError') {
          throw new Error(
            'Authentication was cancelled or timed out. Please try again.'
          );
        } else if (error.name === 'InvalidStateError') {
          throw new Error(
            'No passkeys found for this device. Please register a passkey first.'
          );
        } else if (error.name === 'NotSupportedError') {
          throw new Error(
            'Your device does not support the required authentication method.'
          );
        } else if (error.name === 'SecurityError') {
          throw new Error(
            "Authentication failed due to security restrictions. Please ensure you're on a secure connection."
          );
        } else if (error.name === 'AbortError') {
          throw new Error('Authentication was aborted. Please try again.');
        } else if (error.name === 'UnknownError') {
          throw new Error(
            'An unknown error occurred during authentication. Please try again.'
          );
        } else if (error.message?.includes('cancelled')) {
          throw new Error('Authentication was cancelled. Please try again.');
        } else if (error.message?.includes('timeout')) {
          throw new Error('Authentication timed out. Please try again.');
        } else if (error.message?.includes('not found')) {
          throw new Error(
            'No passkeys found for this device. Please register a passkey first.'
          );
        } else {
          throw new Error(
            `Authentication failed: ${error.message || 'Unknown error occurred'}`
          );
        }
      }

      console.log('Credential obtained by SimpleWebAuthn browser:', credential);

      // Send to server for verification
      let verificationResult;
      try {
        console.log('Sending credential to server for verification...');
        verificationResult = await this.apiCall(
          '/api/authenticate/complete',
          'POST',
          {
            credential: credential,
            challengeToken: options.challengeToken, // Include the challenge token
          }
        );
        console.log('Server verification completed:', verificationResult);
      } catch (error: any) {
        console.error('Server verification error:', error);

        // Handle specific server errors
        if (error.message?.includes('Credential not found')) {
          throw new Error(
            'This passkey is not recognized. Please register a new passkey or try a different device.'
          );
        } else if (error.message?.includes('Invalid or expired challenge')) {
          throw new Error(
            'Authentication session expired. Please try logging in again.'
          );
        } else if (error.message?.includes('verification failed')) {
          throw new Error(
            'Passkey verification failed. This may indicate tampering or an invalid credential.'
          );
        } else if (error.message?.includes('User not found')) {
          throw new Error(
            'No account found for this passkey. Please register a new account.'
          );
        } else {
          throw new Error(
            `Server error: ${error.message || 'Authentication failed on server'}`
          );
        }
      }

      if (!verificationResult.verified) {
        console.error('Verification failed, result:', verificationResult);
        throw new Error(
          'Passkey verification failed. Please try again or register a new passkey.'
        );
      }

      // Store session token if provided
      if (verificationResult.sessionToken) {
        this.setSessionToken(verificationResult.sessionToken);
        console.log('Session token saved for cross-domain persistence');
      }

      console.log('Authentication successful!');
      console.log('=== AuthService.login SUCCESS ===');
      return verificationResult.username;
    } catch (error) {
      console.error('=== AuthService.login ERROR ===');
      console.error('Authentication error:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);

      // Re-throw with preserved message if it's already a user-friendly error
      if (error instanceof Error) {
        console.error('Re-throwing Error instance:', error.message);
        throw error;
      }

      // Fallback for unknown error types
      const fallbackError = new Error(
        'Login failed due to an unexpected error. Please try again.'
      );
      console.error('Throwing fallback error:', fallbackError.message);
      throw fallbackError;
    }
  }

  // Debug method to check stored credentials
  static async getStoredCredentials(username: string) {
    try {
      return await this.apiCall(
        `/api/users/${encodeURIComponent(username)}/credentials`
      );
    } catch (error) {
      console.error('Failed to get stored credentials:', error);
      return { credentials: [] };
    }
  }
}
