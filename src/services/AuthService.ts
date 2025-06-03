export interface CredentialData {
  id: string;
  rawId: number[];
  username: string;
  rpId: string;
}

export class AuthService {
  private static readonly CREDENTIAL_STORAGE_KEY = 'passkey_credential';

  static checkSupport(): boolean {
    return !!window.PublicKeyCredential;
  }

  static getRpId(): string {
    const hostname = window.location.hostname;
    return hostname === 'localhost' ? 'localhost' : hostname;
  }

  static async register(username: string): Promise<CredentialData> {
    if (!username.trim()) {
      throw new Error('Username is required');
    }

    // Generate a random challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // User ID (should be unique and persistent)
    const userId = new TextEncoder().encode(username);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions =
      {
        challenge,
        rp: {
          name: 'Passkeys Demo',
          id: this.getRpId(),
        },
        user: {
          id: userId,
          name: username,
          displayName: username,
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

    if (!credential) {
      throw new Error('Failed to create credential');
    }

    // Store credential info (in a real app, send to server)
    const credentialData: CredentialData = {
      id: credential.id,
      rawId: Array.from(new Uint8Array(credential.rawId)),
      username: username,
      rpId: this.getRpId(),
    };

    localStorage.setItem(
      this.CREDENTIAL_STORAGE_KEY,
      JSON.stringify(credentialData)
    );

    return credentialData;
  }

  static async login(): Promise<string> {
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

    if (!credential) {
      throw new Error('Failed to authenticate');
    }

    // Try to get username from stored credential if available
    const storedCredential = localStorage.getItem(this.CREDENTIAL_STORAGE_KEY);
    const username = storedCredential
      ? JSON.parse(storedCredential).username
      : 'User';

    return username;
  }
}
