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

export class AuthService {
  private static readonly API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  static checkSupport(): boolean {
    return !!window.PublicKeyCredential;
  }

  static getRpId(): string {
    const hostname = window.location.hostname;
    return hostname === 'localhost' ? 'localhost' : hostname;
  }

  private static async apiCall(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ) {
    const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `API error: ${response.status}`);
    }

    return await response.json();
  }

  static async register(username: string): Promise<CredentialData> {
    if (!username.trim()) {
      throw new Error('Username is required');
    }

    try {
      console.log('=== REGISTRATION START ===');
      console.log('WebAuthn supported:', this.checkSupport());

      // Get registration options from server
      const options = await this.apiCall('/api/register/begin', 'POST', {
        username: username.trim(),
      });

      console.log('Registration options from server:', options);

      // Use SimpleWebAuthn browser library to handle registration
      const credential = await startRegistration(options);

      console.log('Credential created by SimpleWebAuthn browser:', credential);

      // Send to server for verification
      const verificationResult = await this.apiCall(
        '/api/register/complete',
        'POST',
        {
          username: username.trim(),
          credential: credential,
        }
      );

      if (!verificationResult.verified) {
        throw new Error('Registration verification failed');
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
      throw new Error(
        `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  static async login(): Promise<string> {
    try {
      console.log('=== LOGIN START ===');
      console.log('WebAuthn supported:', this.checkSupport());

      // Get authentication options from server
      const options = await this.apiCall('/api/authenticate/begin', 'POST');

      console.log('Authentication options from server:', options);

      // Use SimpleWebAuthn browser library to handle authentication
      const credential = await startAuthentication(options);

      console.log('Credential obtained by SimpleWebAuthn browser:', credential);

      // Send to server for verification
      const verificationResult = await this.apiCall(
        '/api/authenticate/complete',
        'POST',
        {
          credential: credential,
        }
      );

      if (!verificationResult.verified) {
        throw new Error('Authentication verification failed');
      }

      console.log('Authentication successful!');
      return verificationResult.username;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
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
