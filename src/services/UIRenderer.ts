/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ValidationResult } from './ValidationService.js';

export class UIRenderer {
  static render(
    isLoggedIn: boolean,
    username: string,
    loadingState?: {
      isRegistering?: boolean;
      isAuthenticating?: boolean;
      validationState?: ValidationResult;
      isValidating?: boolean;
    }
  ): void {
    const app = document.querySelector<HTMLDivElement>('#app');
    if (!app) {
      throw new Error('App container not found');
    }

    app.innerHTML = `
      <div class="container">
        <div class="header">
          <h1>
            <span class="material-symbols-rounded header-icon">passkey</span>
            Passkeys Login Demo
          </h1>
          <a href="https://github.com/mabreyes/cssecdv-passkeys" target="_blank" rel="noopener noreferrer" class="github-link">
            <span class="material-symbols-rounded">code</span>
            View on GitHub
          </a>
        </div>
        <div id="message" class="message"></div>
        <div class="cards-layout">
          <div class="main-card">
            ${isLoggedIn ? this.renderDashboard(username) : this.renderLogin(loadingState)}
          </div>
          <div class="info-detail-card">
            ${this.renderPasskeyInfo()}
          </div>
        </div>
        <footer class="footer">
          <p>Created by <strong>Marc Reyes</strong></p>
        </footer>
      </div>
      
      <!-- Passkeys Education Modal -->
      <div id="passkeys-modal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h2>How Passkeys Work</h2>
            <button id="close-modal" class="modal-close">
              <span class="material-symbols-rounded">close</span>
            </button>
          </div>
          <div class="modal-navigation">
            <button id="scroll-left" class="tab-scroll-btn tab-scroll-left" aria-label="Scroll tabs left">
              <span class="material-symbols-rounded">chevron_left</span>
            </button>
            <div class="modal-tabs" id="modal-tabs-container">
              <button class="modal-tab active" data-section="intro">Introduction</button>
              <button class="modal-tab" data-section="crypto">Cryptography</button>
              <button class="modal-tab" data-section="registration">Registration</button>
              <button class="modal-tab" data-section="authentication">Authentication</button>
              <button class="modal-tab" data-section="architecture">Architecture</button>
              <button class="modal-tab" data-section="protocols">Protocols</button>
              <button class="modal-tab" data-section="security">Security</button>
              <button class="modal-tab" data-section="devices">Devices</button>
              <button class="modal-tab" data-section="sync">Sync</button>
              <button class="modal-tab" data-section="standards">Standards</button>
              <button class="modal-tab" data-section="implementation">Our Code</button>
              <button class="modal-tab" data-section="best-practices">Best Practices</button>
              <button class="modal-tab" data-section="future">Future</button>
              <button class="modal-tab" data-section="resources">Resources</button>
            </div>
            <button id="scroll-right" class="tab-scroll-btn tab-scroll-right" aria-label="Scroll tabs right">
              <span class="material-symbols-rounded">chevron_right</span>
            </button>
          </div>
          <div class="modal-body">
            ${this.renderPasskeysEducation()}
          </div>
        </div>
      </div>
    `;
  }

  private static renderLogin(loadingState?: {
    isRegistering?: boolean;
    isAuthenticating?: boolean;
    validationState?: ValidationResult;
    isValidating?: boolean;
  }): string {
    const isRegistering = loadingState?.isRegistering || false;
    const isAuthenticating = loadingState?.isAuthenticating || false;
    const isLoading = isRegistering || isAuthenticating;

    return `
      <div class="login-section">
        <h2>Welcome</h2>
        <p>Use passkeys for secure, passwordless authentication</p>
        
        <div class="form-group">
          <md-filled-text-field
            id="username"
            name="username-${Math.random().toString(36).substring(7)}"
            label="Username"
            placeholder="Enter your username (3-20 characters)"
            type="text"
            autocomplete="new-password"
            autocapitalize="off"
            autocorrect="off"
            spellcheck="false"
            readonly
            onfocus="this.removeAttribute('readonly')"
            data-form-type="other"
            ${isLoading ? 'disabled' : ''}>
          </md-filled-text-field>
        </div>
        
        <div class="button-group">
          <md-filled-button 
            id="register-btn" 
            class="primary-button"
            type="button"
            disabled>
            <span class="material-symbols-rounded" slot="icon">${isRegistering ? 'hourglass_empty' : 'fingerprint'}</span>
            ${isRegistering ? 'Creating Passkey...' : 'Register with Passkey'}
          </md-filled-button>
          
          <div class="separator">
            <div class="separator-line"></div>
            <span class="separator-text">OR</span>
            <div class="separator-line"></div>
          </div>
          
          <div class="existing-account-text">
            <p>I have an existing account</p>
          </div>
          
          <md-outlined-button 
            id="login-btn" 
            class="secondary-button" 
            type="button"
            ${isLoading ? 'disabled' : ''}>
            <span class="material-symbols-rounded" slot="icon">${isAuthenticating ? 'hourglass_empty' : 'vpn_key'}</span>
            ${isAuthenticating ? 'Authenticating...' : 'Login with Passkey'}
          </md-outlined-button>
        </div>
        
        <div class="info-card">
          <div class="info">
            <h3>Username Requirements</h3>
            <md-list>
              <md-list-item>
                <span class="material-symbols-rounded" slot="start">rule</span>
                <div slot="headline">3-20 characters long</div>
              </md-list-item>
              <md-list-item>
                <span class="material-symbols-rounded" slot="start">abc</span>
                <div slot="headline">Letters, numbers, underscores, and hyphens only</div>
              </md-list-item>
              <md-list-item>
                <span class="material-symbols-rounded" slot="start">block</span>
                <div slot="headline">Cannot start/end with special characters</div>
              </md-list-item>
              <md-list-item>
                <span class="material-symbols-rounded" slot="start">group</span>
                <div slot="headline">Must be unique (not already taken)</div>
              </md-list-item>
            </md-list>
          </div>
        </div>
      </div>
    `;
  }

  private static renderDashboard(username: string): string {
    return `
      <div class="dashboard">
        <div class="dashboard-content">
          <div class="dashboard-header">
            <div class="dashboard-user-info">
              <p class="dashboard-greeting">Welcome back, <span class="dashboard-username">${username}</span></p>
            </div>
          </div>
          <h2>
            You're all set!
            <span class="material-symbols-rounded celebration-icon">celebration</span>
          </h2>
          <p>You are successfully logged in with your passkey.</p>
          <div class="dashboard-benefits">
            <h4>Why passkeys are secure:</h4>
            <ul>
              <li><strong>Passwordless:</strong> No passwords to steal or forget</li>
              <li><strong>Phishing resistant:</strong> Works only on this exact site</li>
              <li><strong>Biometric protection:</strong> Your device authenticates you</li>
              <li><strong>Industry standard:</strong> Built on WebAuthn/FIDO2 protocols</li>
            </ul>
          </div>
        </div>
        <div class="dashboard-actions">
          <md-filled-button 
            id="learn-more-btn" 
            class="learn-more-button"
            type="button">
            <span class="material-symbols-rounded" slot="icon">school</span>
            How Passkeys Work
          </md-filled-button>
          <md-outlined-button 
            id="logout-btn" 
            class="logout-button"
            type="button">
            <span class="material-symbols-rounded" slot="icon">logout</span>
            Logout
          </md-outlined-button>
        </div>
      </div>
    `;
  }

  private static renderPasskeysEducation(): string {
    return `
      <div class="passkeys-education">
        <!-- Introduction -->
        <div class="education-section" id="section-intro">
          <h3><span class="material-symbols-rounded">info</span>What Are Passkeys?</h3>
          <p>Passkeys are a revolutionary authentication technology that replaces passwords with cryptographic key pairs. They leverage your device's built-in security features like Face ID, Touch ID, or Windows Hello to provide seamless, secure, and phishing-resistant authentication.</p>
          <div class="concept-highlight">
            <span class="material-symbols-rounded">lightbulb</span>
            <div>
              <strong>Key Insight:</strong>
              <p>Unlike passwords, passkeys are mathematically unique for each website and cannot be reused, stolen in data breaches, or phished by attackers.</p>
            </div>
          </div>
        </div>

        <!-- Cryptographic Foundation -->
        <div class="education-section" id="section-crypto">
          <h3><span class="material-symbols-rounded">key</span>Cryptographic Foundation</h3>
          <p>Passkeys use asymmetric (public-key) cryptography, specifically Elliptic Curve Digital Signature Algorithm (ECDSA) with P-256 curves. This creates a mathematically linked key pair where one key can verify signatures created by its counterpart.</p>
          <div class="crypto-diagram">
            <div class="crypto-explanation">
              <div class="crypto-step">
                <span class="material-symbols-rounded">psychology</span>
                <div>
                  <strong>Mathematical Relationship</strong>
                  <p>Keys are mathematically related but computationally infeasible to derive one from the other</p>
                </div>
              </div>
              <div class="crypto-step">
                <span class="material-symbols-rounded">calculate</span>
                <div>
                  <strong>ECDSA P-256</strong>
                  <p>256-bit elliptic curve providing 128-bit security strength equivalent to 3072-bit RSA</p>
                </div>
              </div>
            </div>
            <div class="key-pair">
              <div class="private-key">
                <span class="material-symbols-rounded">lock</span>
                <div>
                  <strong>Private Key</strong>
                  <small>Secured in device hardware (TPM/Secure Enclave)</small>
                  <div class="key-details">
                    <p>• Never leaves your device</p>
                    <p>• Protected by biometrics/PIN</p>
                    <p>• Used for signing challenges</p>
                    <p>• Hardware-backed storage</p>
                  </div>
                </div>
              </div>
              <div class="key-connector">
                <span class="material-symbols-rounded">link</span>
                <small>Cryptographically Linked</small>
              </div>
              <div class="public-key">
                <span class="material-symbols-rounded">public</span>
                <div>
                  <strong>Public Key</strong>
                  <small>Stored on server for verification</small>
                  <div class="key-details">
                    <p>• Shared with the website</p>
                    <p>• Used for signature verification</p>
                    <p>• Cannot generate signatures</p>
                    <p>• Safe to store publicly</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Registration Process -->
        <div class="education-section" id="section-registration">
          <h3><span class="material-symbols-rounded">app_registration</span>Registration Process (Credential Creation)</h3>
          <p>When you register a passkey, your device generates a new key pair specifically for that website. This process involves multiple security checks and cryptographic operations.</p>
          <div class="registration-flow">
            <div class="reg-step">
              <div class="reg-number">1</div>
              <div class="reg-content">
                <strong>Registration Request</strong>
                <p>Website calls <code>navigator.credentials.create()</code> with registration parameters</p>
                <div class="code-snippet">PublicKeyCredentialCreationOptions</div>
              </div>
            </div>
            <div class="flow-arrow">↓</div>
            <div class="reg-step">
              <div class="reg-number">2</div>
              <div class="reg-content">
                <strong>User Consent & Verification</strong>
                <p>Browser prompts user for consent and biometric/PIN verification</p>
                <div class="security-note">
                  <span class="material-symbols-rounded">security</span>
                  <span>User presence and verification required</span>
                </div>
              </div>
            </div>
            <div class="flow-arrow">↓</div>
            <div class="reg-step">
              <div class="reg-number">3</div>
              <div class="reg-content">
                <strong>Key Generation</strong>
                <p>Authenticator generates new ECDSA P-256 key pair in secure hardware</p>
                <div class="hardware-detail">
                  <span class="material-symbols-rounded">memory</span>
                  <span>Generated in TPM/Secure Enclave</span>
                </div>
              </div>
            </div>
            <div class="flow-arrow">↓</div>
            <div class="reg-step">
              <div class="reg-number">4</div>
              <div class="reg-content">
                <strong>Attestation & Response</strong>
                <p>Authenticator creates attestation statement proving key authenticity and returns public key</p>
                <div class="attestation-types">
                  <div class="attestation-item">
                    <strong>Self Attestation:</strong> Device vouches for itself
                  </div>
                  <div class="attestation-item">
                    <strong>Basic Attestation:</strong> Manufacturer certificate chain
                  </div>
                  <div class="attestation-item">
                    <strong>Anonymous CA:</strong> Privacy-preserving verification
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Authentication Flow -->
        <div class="education-section" id="section-authentication">
          <h3><span class="material-symbols-rounded">login</span>Authentication Flow (Assertion)</h3>
          <p>During login, the server sends a cryptographic challenge that only your device can answer using the private key. This proves you possess the correct key without revealing it.</p>
          <div class="auth-flow">
            <div class="auth-step">
              <div class="auth-number">1</div>
              <div class="auth-content">
                <strong>Authentication Request</strong>
                <p>Server generates random challenge and calls <code>navigator.credentials.get()</code></p>
                <div class="challenge-details">
                  <strong>Challenge Properties:</strong>
                  <ul>
                    <li>32+ bytes of cryptographically random data</li>
                    <li>Prevents replay attacks</li>
                    <li>Unique per authentication attempt</li>
                    <li>Time-bounded validity window</li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="flow-arrow">↓</div>
            <div class="auth-step">
              <div class="auth-number">2</div>
              <div class="auth-content">
                <strong>User Verification</strong>
                <p>Biometric sensor or PIN verifies user identity locally</p>
                <div class="verification-grid">
                  <div class="verification-method">
                    <span class="material-symbols-rounded">fingerprint</span>
                    <span>Fingerprint</span>
                  </div>
                  <div class="verification-method">
                    <span class="material-symbols-rounded">face</span>
                    <span>Face Recognition</span>
                  </div>
                                     <div class="verification-method">
                     <span class="material-symbols-rounded">password</span>
                     <span>Device PIN</span>
                   </div>
                                     <div class="verification-method">
                     <span class="material-symbols-rounded">gesture</span>
                     <span>Pattern/Gesture</span>
                   </div>
                </div>
              </div>
            </div>
            <div class="flow-arrow">↓</div>
            <div class="auth-step">
              <div class="auth-number">3</div>
              <div class="auth-content">
                <strong>Digital Signature Creation</strong>
                <p>Hardware security module creates ECDSA signature using private key</p>
                <div class="signature-process">
                  <div class="signature-input">
                    <strong>Signed Data Includes:</strong>
                    <ul>
                      <li>Server challenge</li>
                      <li>Relying Party ID (RP ID)</li>
                      <li>Client data (origin, type)</li>
                      <li>Authenticator data (counter, flags)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div class="flow-arrow">↓</div>
            <div class="auth-step">
              <div class="auth-number">4</div>
              <div class="auth-content">
                <strong>Signature Verification</strong>
                <p>Server verifies signature using stored public key and validates all parameters</p>
                <div class="verification-checks">
                  <div class="check-item">
                    <span class="material-symbols-rounded">verified</span>
                    <span>Signature mathematically valid</span>
                  </div>
                  <div class="check-item">
                    <span class="material-symbols-rounded">verified</span>
                    <span>Challenge matches sent value</span>
                  </div>
                  <div class="check-item">
                    <span class="material-symbols-rounded">verified</span>
                    <span>Origin matches expected domain</span>
                  </div>
                  <div class="check-item">
                    <span class="material-symbols-rounded">verified</span>
                    <span>User verification flag present</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- WebAuthn Architecture -->
        <div class="education-section" id="section-architecture">
          <h3><span class="material-symbols-rounded">architecture</span>WebAuthn Technical Architecture</h3>
          <p>WebAuthn is a W3C standard that defines the API between web applications and authenticators. It operates across multiple layers of the technology stack.</p>
          <div class="architecture-detailed">
            <div class="arch-layer">
              <div class="layer-label">User Layer</div>
              <div class="arch-component user">
                <span class="material-symbols-rounded">person</span>
                <strong>User</strong>
                <small>Provides biometric/PIN verification</small>
              </div>
            </div>
            <div class="arch-layer">
              <div class="layer-label">Application Layer</div>
              <div class="arch-component webapp">
                <span class="material-symbols-rounded">web</span>
                <strong>Web Application</strong>
                <small>Relying Party (RP)</small>
                <div class="component-details">
                  <p>• Initiates registration/authentication</p>
                  <p>• Stores public keys</p>
                  <p>• Verifies signatures</p>
                  <p>• Manages user sessions</p>
                </div>
              </div>
            </div>
            <div class="arch-layer">
              <div class="layer-label">Browser Layer</div>
                             <div class="arch-component browser">
                 <span class="material-symbols-rounded">web</span>
                 <strong>Browser</strong>
                 <small>WebAuthn API Implementation</small>
                <div class="component-details">
                  <p>• Exposes navigator.credentials API</p>
                  <p>• Mediates between RP and authenticator</p>
                  <p>• Enforces origin binding</p>
                  <p>• Handles user consent UI</p>
                </div>
              </div>
            </div>
            <div class="arch-layer">
              <div class="layer-label">Transport Layer</div>
              <div class="transport-methods">
                <div class="transport-item">
                  <span class="material-symbols-rounded">usb</span>
                  <span>USB</span>
                </div>
                                 <div class="transport-item">
                   <span class="material-symbols-rounded">contactless</span>
                   <span>NFC</span>
                 </div>
                <div class="transport-item">
                  <span class="material-symbols-rounded">bluetooth</span>
                  <span>Bluetooth</span>
                </div>
                <div class="transport-item">
                  <span class="material-symbols-rounded">devices</span>
                  <span>Platform</span>
                </div>
              </div>
            </div>
            <div class="arch-layer">
              <div class="layer-label">Authenticator Layer</div>
              <div class="auth-types">
                <div class="auth-type">
                  <span class="material-symbols-rounded">smartphone</span>
                  <strong>Platform Authenticator</strong>
                  <p>Built into device (Touch ID, Face ID, Windows Hello)</p>
                </div>
                <div class="auth-type">
                  <span class="material-symbols-rounded">key</span>
                  <strong>Roaming Authenticator</strong>
                  <p>External device (YubiKey, security keys)</p>
                </div>
              </div>
            </div>
            <div class="arch-layer">
              <div class="layer-label">Hardware Layer</div>
              <div class="arch-component hardware">
                <span class="material-symbols-rounded">memory</span>
                <strong>Secure Hardware</strong>
                <small>TPM, Secure Enclave, TEE</small>
                <div class="component-details">
                  <p>• Hardware-backed key storage</p>
                  <p>• Tamper-resistant operations</p>
                  <p>• Cryptographic key generation</p>
                  <p>• Secure signature creation</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- FIDO2 Protocol Details -->
        <div class="education-section" id="section-protocols">
          <h3><span class="material-symbols-rounded">hub</span>FIDO2 Protocol Stack</h3>
          <p>FIDO2 consists of WebAuthn (web layer) and CTAP (Client-to-Authenticator Protocol). This stack enables passwordless authentication across platforms and devices.</p>
          <div class="protocol-stack">
            <div class="protocol-layer">
              <div class="protocol-name">WebAuthn</div>
              <div class="protocol-description">
                <strong>W3C Web Authentication API</strong>
                <p>JavaScript API for credential management in web browsers</p>
                <ul>
                  <li>navigator.credentials.create() for registration</li>
                  <li>navigator.credentials.get() for authentication</li>
                  <li>Origin binding and domain validation</li>
                  <li>Attestation and assertion handling</li>
                </ul>
              </div>
            </div>
            <div class="protocol-layer">
              <div class="protocol-name">CTAP2</div>
              <div class="protocol-description">
                <strong>Client-to-Authenticator Protocol v2</strong>
                <p>Communication protocol between platform and authenticator</p>
                <ul>
                  <li>CBOR (Compact Binary Object Representation) encoding</li>
                  <li>PIN/UV auth protocols for user verification</li>
                  <li>Credential management operations</li>
                  <li>Multiple transport support (USB, NFC, BLE)</li>
                </ul>
              </div>
            </div>
            <div class="protocol-layer">
              <div class="protocol-name">CTAP1/U2F</div>
              <div class="protocol-description">
                <strong>Legacy Universal 2nd Factor</strong>
                <p>Backward compatibility for existing U2F devices</p>
                <ul>
                  <li>Simple challenge-response protocol</li>
                  <li>Second factor authentication only</li>
                  <li>Limited to USB and NFC transports</li>
                  <li>No built-in user verification</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Security Analysis -->
        <div class="education-section" id="section-security">
          <h3><span class="material-symbols-rounded">security</span>Comprehensive Security Analysis</h3>
          <p>Passkeys address every major vulnerability present in password-based authentication through multiple layers of cryptographic and protocol-level protections.</p>
          
          <div class="security-comparison">
            <div class="security-category">
              <h4>Attack Resistance</h4>
              <div class="security-grid">
                <div class="security-item">
                  <span class="material-symbols-rounded">block</span>
                  <div>
                    <strong>Phishing Immunity</strong>
                    <p>Cryptographically bound to origin domain. Signatures are only valid for the exact website where the key was registered.</p>
                  </div>
                </div>
                <div class="security-item">
                  <span class="material-symbols-rounded">database</span>
                  <div>
                    <strong>Breach Protection</strong>
                    <p>Only public keys stored on servers. Even if breached, attackers cannot authenticate or derive private keys.</p>
                  </div>
                </div>
                <div class="security-item">
                  <span class="material-symbols-rounded">replay_circle_filled</span>
                  <div>
                    <strong>Replay Attack Prevention</strong>
                    <p>Each authentication includes a unique challenge. Previous signatures cannot be reused.</p>
                  </div>
                </div>
                <div class="security-item">
                  <span class="material-symbols-rounded">person_off</span>
                  <div>
                    <strong>Man-in-the-Middle Resistance</strong>
                    <p>Client data includes origin verification. Proxied attacks fail signature validation.</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="security-category">
              <h4>Cryptographic Strength</h4>
              <div class="crypto-strength">
                <div class="strength-item">
                  <strong>Algorithm:</strong> ECDSA with P-256 curve
                </div>
                <div class="strength-item">
                  <strong>Security Level:</strong> 128-bit equivalent (quantum-safe planning)
                </div>
                <div class="strength-item">
                  <strong>Key Generation:</strong> Hardware-based random number generation
                </div>
                <div class="strength-item">
                  <strong>Storage:</strong> Hardware security module protection
                </div>
              </div>
            </div>

            <div class="security-category">
              <h4>Privacy Protections</h4>
              <div class="privacy-grid">
                <div class="privacy-item">
                  <span class="material-symbols-rounded">visibility_off</span>
                  <div>
                    <strong>No Cross-Site Tracking</strong>
                    <p>Each website gets unique credentials. No correlation possible across sites.</p>
                  </div>
                </div>
                <div class="privacy-item">
                  <span class="material-symbols-rounded">fingerprint_off</span>
                  <div>
                    <strong>Anonymous Authentication</strong>
                    <p>No personally identifiable information in the protocol itself.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Device Security Implementation -->
        <div class="education-section" id="section-devices">
          <h3><span class="material-symbols-rounded">shield</span>Device-Level Security Implementation</h3>
          <p>Passkeys leverage dedicated security hardware present in modern devices to ensure cryptographic operations occur in a tamper-resistant environment.</p>
          
          <div class="device-security">
            <div class="platform-security">
              <div class="platform-item">
                <span class="material-symbols-rounded">phone_iphone</span>
                <div>
                  <strong>iOS - Secure Enclave</strong>
                  <p>Dedicated ARM-based processor with encrypted memory</p>
                  <ul>
                    <li>Hardware-isolated key generation and storage</li>
                    <li>Touch ID/Face ID biometric processing</li>
                    <li>Kernel-independent operation</li>
                    <li>Cryptographic operations in secure environment</li>
                  </ul>
                </div>
              </div>
              <div class="platform-item">
                <span class="material-symbols-rounded">android</span>
                <div>
                  <strong>Android - Hardware Security Module</strong>
                  <p>Trusted Execution Environment (TEE) or discrete security chip</p>
                  <ul>
                    <li>StrongBox Keymaster for hardware-backed keys</li>
                    <li>Biometric authentication in secure environment</li>
                    <li>Attestation key injection during manufacturing</li>
                    <li>Hardware-enforced access controls</li>
                  </ul>
                </div>
              </div>
              <div class="platform-item">
                <span class="material-symbols-rounded">desktop_windows</span>
                <div>
                  <strong>Windows - TPM 2.0</strong>
                  <p>Trusted Platform Module with cryptographic capabilities</p>
                  <ul>
                    <li>Hardware random number generation</li>
                    <li>Secure key storage with usage policies</li>
                    <li>Platform Configuration Register (PCR) measurements</li>
                    <li>Windows Hello integration</li>
                  </ul>
                </div>
              </div>
              <div class="platform-item">
                <span class="material-symbols-rounded">laptop_mac</span>
                <div>
                  <strong>macOS - Secure Enclave</strong>
                  <p>T2 or Apple Silicon security coprocessor</p>
                  <ul>
                    <li>Dedicated AES encryption engine</li>
                    <li>Touch ID sensor data processing</li>
                    <li>Secure boot and software verification</li>
                    <li>Encrypted storage with hardware keys</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cross-Platform Synchronization -->
        <div class="education-section" id="section-sync">
          <h3><span class="material-symbols-rounded">sync</span>Cross-Platform Passkey Synchronization</h3>
          <p>Modern passkey implementations include secure synchronization across your devices within the same ecosystem, enabling seamless authentication while maintaining security.</p>
          
          <div class="sync-explanation">
            <div class="sync-process">
              <div class="sync-step">
                <span class="material-symbols-rounded">encrypted</span>
                <div>
                  <strong>End-to-End Encryption</strong>
                  <p>Private keys are encrypted with your account's master key before leaving the device. Even the platform provider cannot decrypt them.</p>
                </div>
              </div>
              <div class="sync-step">
                <span class="material-symbols-rounded">cloud_sync</span>
                <div>
                  <strong>Secure Cloud Backup</strong>
                  <p>Encrypted passkey data is stored in your iCloud Keychain, Google Password Manager, or Windows credentials.</p>
                </div>
              </div>
              <div class="sync-step">
                <span class="material-symbols-rounded">devices</span>
                <div>
                  <strong>Multi-Device Access</strong>
                  <p>Synchronized passkeys work across all your authenticated devices within the same ecosystem.</p>
                </div>
              </div>
            </div>
            
            <div class="sync-security">
              <h4>Synchronization Security Model</h4>
              <ul>
                <li><strong>Zero-Knowledge Architecture:</strong> Platform providers cannot access private key material</li>
                <li><strong>Device Authentication:</strong> Only devices authenticated to your account can decrypt passkeys</li>
                <li><strong>Recovery Protection:</strong> Account recovery requires multiple verification factors</li>
                <li><strong>Forward Secrecy:</strong> Compromised sync data cannot decrypt future operations</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Implementation Standards -->
        <div class="education-section" id="section-standards">
          <h3><span class="material-symbols-rounded">code</span>Technical Standards & Specifications</h3>
          <p>Passkeys are built on open standards developed by the W3C and FIDO Alliance, ensuring interoperability and security across platforms and vendors.</p>
          
          <div class="standards-detailed">
            <div class="standard-item">
              <div class="standard-header">
                <span class="material-symbols-rounded">web</span>
                <strong>WebAuthn Level 2 (W3C Recommendation)</strong>
              </div>
              <div class="standard-description">
                <p>Web Authentication API specification defining browser interfaces for cryptographic authentication</p>
                <div class="standard-features">
                  <h5>Key Features:</h5>
                  <ul>
                    <li>PublicKeyCredential interface for credential management</li>
                    <li>AuthenticatorAssertionResponse for authentication data</li>
                    <li>CollectedClientData for origin and challenge binding</li>
                    <li>Extensions mechanism for vendor-specific features</li>
                    <li>Attestation conveyance preference options</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="standard-item">
              <div class="standard-header">
                <span class="material-symbols-rounded">security</span>
                <strong>FIDO2 (FIDO Alliance)</strong>
              </div>
              <div class="standard-description">
                <p>Comprehensive passwordless authentication framework combining WebAuthn and CTAP</p>
                <div class="standard-features">
                  <h5>Components:</h5>
                  <ul>
                    <li>WebAuthn for web application integration</li>
                    <li>CTAP2 for authenticator communication protocol</li>
                    <li>FIDO Metadata Service for authenticator verification</li>
                    <li>Certification programs for device compliance</li>
                    <li>Conformance testing suites</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="standard-item">
                             <div class="standard-header">
                 <span class="material-symbols-rounded">electrical_services</span>
                 <strong>CTAP2 (Client-to-Authenticator Protocol)</strong>
               </div>
              <div class="standard-description">
                <p>Binary protocol for communication between platform and external/platform authenticators</p>
                <div class="standard-features">
                  <h5>Protocol Features:</h5>
                  <ul>
                    <li>CBOR encoding for efficient binary communication</li>
                    <li>PIN/UV auth protocols for user verification</li>
                    <li>Credential management (enumerate, delete)</li>
                    <li>Large blob storage for additional data</li>
                    <li>Multiple transport binding (USB HID, NFC, BLE)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="standard-item">
              <div class="standard-header">
                <span class="material-symbols-rounded">verified</span>
                <strong>FIDO Metadata Service</strong>
              </div>
              <div class="standard-description">
                <p>Centralized service providing authenticator metadata and security attestations</p>
                <div class="standard-features">
                  <h5>Metadata Information:</h5>
                  <ul>
                    <li>Authenticator security characteristics</li>
                    <li>Supported algorithms and extensions</li>
                    <li>Security vulnerability disclosures</li>
                    <li>Certification levels and compliance status</li>
                    <li>Trust anchor certificates for attestation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Developer Implementation -->
        <div class="education-section" id="section-best-practices">
          <h3><span class="material-symbols-rounded">integration_instructions</span>Implementation Considerations</h3>
          <p>Implementing passkeys requires careful consideration of user experience, security policies, and fallback mechanisms.</p>
          
          <div class="implementation-guide">
            <div class="impl-category">
              <h4>Server-Side Requirements</h4>
              <ul>
                <li><strong>Challenge Generation:</strong> Cryptographically secure random challenges (32+ bytes)</li>
                <li><strong>Public Key Storage:</strong> Secure database schema for credential storage</li>
                <li><strong>Signature Verification:</strong> ECDSA P-256 signature validation</li>
                <li><strong>Origin Validation:</strong> Strict origin checking for client data</li>
                <li><strong>Replay Protection:</strong> Challenge uniqueness enforcement</li>
                <li><strong>Attestation Verification:</strong> Optional but recommended for high-security applications</li>
              </ul>
            </div>

            <div class="impl-category">
              <h4>Client-Side Integration</h4>
              <ul>
                <li><strong>Feature Detection:</strong> Check PublicKeyCredential API availability</li>
                <li><strong>Error Handling:</strong> Graceful degradation for unsupported devices</li>
                <li><strong>User Experience:</strong> Clear messaging and fallback options</li>
                <li><strong>Progressive Enhancement:</strong> Layer on top of existing authentication</li>
                <li><strong>Transport Selection:</strong> Allow user choice between platform and roaming authenticators</li>
              </ul>
            </div>

            <div class="impl-category">
              <h4>Security Best Practices</h4>
              <ul>
                <li><strong>HTTPS Required:</strong> WebAuthn only works over secure connections</li>
                <li><strong>RP ID Validation:</strong> Ensure Relying Party ID matches your domain</li>
                <li><strong>User Verification:</strong> Require UV for sensitive operations</li>
                <li><strong>Credential Backup:</strong> Consider multiple registration options</li>
                <li><strong>Recovery Mechanisms:</strong> Provide secure account recovery paths</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Future Outlook -->
        <div class="education-section" id="section-future">
          <h3><span class="material-symbols-rounded">trending_up</span>Future of Passwordless Authentication</h3>
          <p>Passkeys represent the beginning of a passwordless future, with ongoing developments in quantum resistance, enhanced privacy, and broader ecosystem support.</p>
          
          <div class="future-developments">
            <div class="future-item">
              <span class="material-symbols-rounded">science</span>
              <div>
                <strong>Post-Quantum Cryptography</strong>
                <p>Migration to quantum-resistant algorithms (CRYSTALS-Dilithium, Falcon) as quantum computing advances</p>
              </div>
            </div>
            <div class="future-item">
              <span class="material-symbols-rounded">privacy_tip</span>
              <div>
                <strong>Enhanced Privacy</strong>
                <p>Zero-knowledge proofs and anonymous credentials for authentication without identification</p>
              </div>
            </div>
            <div class="future-item">
              <span class="material-symbols-rounded">devices_other</span>
              <div>
                <strong>IoT Integration</strong>
                <p>Extending passkey authentication to Internet of Things devices and embedded systems</p>
              </div>
            </div>
            <div class="future-item">
              <span class="material-symbols-rounded">corporate_fare</span>
              <div>
                <strong>Enterprise Adoption</strong>
                <p>Advanced management capabilities for organizational credential policies and compliance</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Our Implementation -->
        <div class="education-section" id="section-implementation">
          <h3><span class="material-symbols-rounded">code</span>How We Built This Demo</h3>
          <p>This passkeys demo showcases a complete TypeScript implementation using modern web standards. Here's how we handle the key components:</p>
          
          <div class="implementation-details">
            <div class="impl-component">
              <div class="impl-header">
                <span class="material-symbols-rounded">storage</span>
                <strong>Public Key Storage</strong>
              </div>
              <div class="impl-description">
                <p>We store public keys in Redis for fast retrieval during authentication:</p>
                <div class="code-block">
                  <pre><code>// Store public key after registration
await redis.setex(
  \`user:\${username}:publicKey\`,
  CREDENTIAL_TTL,
  JSON.stringify({
    credentialId: credential.id,
    publicKey: credential.publicKey,
    algorithm: credential.algorithm,
    counter: 0
  })
);</code></pre>
                </div>
                <ul>
                  <li>Indexed by username for quick lookups</li>
                  <li>TTL (Time To Live) for automatic cleanup</li>
                  <li>Includes counter for replay attack prevention</li>
                  <li>JSON serialization for complex data structures</li>
                </ul>
              </div>
            </div>

            <div class="impl-component">
              <div class="impl-header">
                <span class="material-symbols-rounded">verified</span>
                <strong>Signature Verification</strong>
              </div>
              <div class="impl-description">
                <p>Our server validates cryptographic signatures using Node.js crypto:</p>
                <div class="code-block">
                  <pre><code>// Verify ECDSA signature
const verifier = crypto.createVerify('SHA256');
verifier.update(authenticatorData);
verifier.update(clientDataHash);

const isValid = verifier.verify(
  publicKeyPem,
  signature,
  'base64'
);

if (!isValid) {
  throw new Error('Invalid signature');
}</code></pre>
                </div>
                <ul>
                  <li>SHA-256 hashing for data integrity</li>
                  <li>ECDSA signature verification</li>
                  <li>Base64 encoding for web compatibility</li>
                  <li>Strict validation with error handling</li>
                </ul>
              </div>
            </div>

            <div class="impl-component">
              <div class="impl-header">
                <span class="material-symbols-rounded">security</span>
                <strong>Challenge Generation</strong>
              </div>
              <div class="impl-description">
                <p>We generate cryptographically secure random challenges:</p>
                <div class="code-block">
                  <pre><code>// Generate 32-byte random challenge
const challenge = crypto.randomBytes(32);
const challengeB64 = challenge.toString('base64url');

// Store temporarily for verification
await redis.setex(
  \`challenge:\${sessionId}\`,
  300, // 5 minute expiry
  challengeB64
);</code></pre>
                </div>
                <ul>
                  <li>32 bytes of cryptographically secure randomness</li>
                  <li>Base64URL encoding for web standards</li>
                  <li>Short-lived storage (5 minutes)</li>
                  <li>Session-bound for user isolation</li>
                </ul>
              </div>
            </div>

            <div class="impl-component">
              <div class="impl-header">
                <span class="material-symbols-rounded">web</span>
                <strong>Client-Side Integration</strong>
              </div>
              <div class="impl-description">
                <p>Frontend implementation using the WebAuthn API:</p>
                <div class="code-block">
                  <pre><code>// Registration
const credential = await navigator.credentials.create({
  publicKey: {
    challenge: Uint8Array.from(challenge, c => c.charCodeAt(0)),
    rp: { name: "Passkeys Demo", id: "localhost" },
    user: { 
      id: Uint8Array.from(userId, c => c.charCodeAt(0)),
      name: username,
      displayName: username 
    },
    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required"
    }
  }
});</code></pre>
                </div>
                <ul>
                  <li>Platform authenticator preference</li>
                  <li>Required user verification</li>
                  <li>ECDSA P-256 algorithm specification</li>
                  <li>Proper byte array conversions</li>
                </ul>
              </div>
            </div>

            <div class="impl-component">
              <div class="impl-header">
                <span class="material-symbols-rounded">error_outline</span>
                <strong>Error Handling</strong>
              </div>
              <div class="impl-description">
                <p>Comprehensive error handling for better user experience:</p>
                <div class="code-block">
                  <pre><code>try {
  await sessionManager.register(username);
} catch (error) {
  if (error.name === 'NotAllowedError') {
    showMessage('Registration cancelled by user', 'info');
  } else if (error.name === 'InvalidStateError') {
    showMessage('Passkey already exists', 'warning');
  } else {
    showMessage('Registration failed: ' + error.message, 'error');
  }
}</code></pre>
                </div>
                <ul>
                  <li>WebAuthn error code interpretation</li>
                  <li>User-friendly error messages</li>
                  <li>Graceful degradation strategies</li>
                  <li>Detailed logging for debugging</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Resources -->
        <div class="education-section" id="section-resources">
          <h3><span class="material-symbols-rounded">book</span>Additional Resources</h3>
          <p>Explore these resources to deepen your understanding of passkeys and implement them in your own projects.</p>
          
          <div class="resources-grid">
            <div class="resource-category">
              <h4>Official Documentation</h4>
              <div class="resource-links">
                <a href="https://passkeys.dev" target="_blank" rel="noopener noreferrer" class="resource-link primary">
                  <span class="material-symbols-rounded">launch</span>
                  <div>
                    <strong>Passkeys.dev</strong>
                    <p>Comprehensive guide and implementation examples from industry experts</p>
                  </div>
                </a>
                <a href="https://webauthn.guide" target="_blank" rel="noopener noreferrer" class="resource-link">
                  <span class="material-symbols-rounded">menu_book</span>
                  <div>
                    <strong>WebAuthn Guide</strong>
                    <p>Detailed technical guide to WebAuthn implementation</p>
                  </div>
                </a>
                <a href="https://www.w3.org/TR/webauthn-2/" target="_blank" rel="noopener noreferrer" class="resource-link">
                  <span class="material-symbols-rounded">description</span>
                  <div>
                    <strong>W3C WebAuthn Specification</strong>
                    <p>Official technical specification from the World Wide Web Consortium</p>
                  </div>
                </a>
              </div>
            </div>

            <div class="resource-category">
              <h4>Developer Tools</h4>
              <div class="resource-links">
                <a href="https://webauthn.io" target="_blank" rel="noopener noreferrer" class="resource-link">
                  <span class="material-symbols-rounded">bug_report</span>
                  <div>
                    <strong>WebAuthn.io</strong>
                    <p>Interactive testing tool for WebAuthn flows</p>
                  </div>
                </a>
                <a href="https://github.com/passwordless-lib" target="_blank" rel="noopener noreferrer" class="resource-link">
                  <span class="material-symbols-rounded">code</span>
                  <div>
                    <strong>Passwordless Libraries</strong>
                    <p>Open-source libraries for multiple programming languages</p>
                  </div>
                </a>
                <a href="https://fidoalliance.org/certification/" target="_blank" rel="noopener noreferrer" class="resource-link">
                  <span class="material-symbols-rounded">verified</span>
                  <div>
                    <strong>FIDO Certification</strong>
                    <p>Official certification programs for FIDO2 compliance</p>
                  </div>
                </a>
              </div>
            </div>

            <div class="resource-category">
              <h4>Community & Examples</h4>
              <div class="resource-links">
                <a href="https://github.com/mabreyes/cssecdv-passkeys" target="_blank" rel="noopener noreferrer" class="resource-link">
                  <span class="material-symbols-rounded">code</span>
                  <div>
                    <strong>This Demo's Source Code</strong>
                    <p>Complete TypeScript implementation with Redis backend</p>
                  </div>
                </a>
                <a href="https://passkeys-demo.appspot.com/" target="_blank" rel="noopener noreferrer" class="resource-link">
                  <span class="material-symbols-rounded">web</span>
                  <div>
                    <strong>Google's Passkeys Demo</strong>
                    <p>Interactive demonstration by the Chrome team</p>
                  </div>
                </a>
                <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API" target="_blank" rel="noopener noreferrer" class="resource-link">
                  <span class="material-symbols-rounded">school</span>
                  <div>
                    <strong>MDN Web Docs</strong>
                    <p>Comprehensive API documentation and tutorials</p>
                  </div>
                </a>
              </div>
            </div>

            <div class="resource-category">
              <h4>Security Research</h4>
              <div class="resource-links">
                <a href="https://eprint.iacr.org/2023/1097.pdf" target="_blank" rel="noopener noreferrer" class="resource-link">
                  <span class="material-symbols-rounded">article</span>
                  <div>
                    <strong>Security Analysis Papers</strong>
                    <p>Academic research on FIDO2 and WebAuthn security</p>
                  </div>
                </a>
                <a href="https://fidoalliance.org/white-papers/" target="_blank" rel="noopener noreferrer" class="resource-link">
                  <span class="material-symbols-rounded">description</span>
                  <div>
                    <strong>FIDO Alliance White Papers</strong>
                    <p>In-depth security and implementation guidance</p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <div class="resource-footer">
            <div class="footer-highlight">
              <span class="material-symbols-rounded">tips_and_updates</span>
              <div>
                <strong>Start Your Implementation</strong>
                <p>Ready to add passkeys to your application? Begin with <a href="https://passkeys.dev" target="_blank" rel="noopener noreferrer">passkeys.dev</a> for the most comprehensive getting-started guide, including production-ready code examples and best practices.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private static renderPasskeyInfo(): string {
    return `
      <div class="passkey-info">
        <h2>What are Passkeys?</h2>
        
        <div class="info-section">
          <h3><span class="material-symbols-rounded">shield</span>Passwordless Authentication</h3>
          <p>Passkeys replace passwords with cryptographic key pairs, eliminating the need to remember complex passwords or worry about password breaches.</p>
        </div>

        <div class="info-section">
          <h3><span class="material-symbols-rounded">fingerprint</span>Biometric Security</h3>
          <p>Use your device's built-in biometric sensors (Face ID, Touch ID, Windows Hello) or security keys for authentication. Your biometric data never leaves your device.</p>
        </div>

        <div class="info-section">
          <h3><span class="material-symbols-rounded">sync</span>Cross-Platform Sync</h3>
          <p>Passkeys sync across your devices through your platform's ecosystem (iCloud Keychain, Google Password Manager) making them available wherever you need them.</p>
        </div>

        <div class="info-section">
          <h3><span class="material-symbols-rounded">block</span>Phishing Resistant</h3>
          <p>Passkeys are bound to specific websites and cannot be tricked by phishing sites, providing superior protection against social engineering attacks.</p>
        </div>

        <div class="info-section">
          <h3><span class="material-symbols-rounded">public</span>Industry Standard</h3>
          <p>Built on WebAuthn and FIDO2 standards, passkeys are supported by major browsers and platforms including Apple, Google, Microsoft, and more.</p>
        </div>

        <div class="supported-platforms">
          <h3>Supported Platforms</h3>
          <div class="platform-grid">
            <div class="platform-item">
              <span class="material-symbols-rounded">phone_iphone</span>
              <span>iOS 16+</span>
            </div>
            <div class="platform-item">
              <span class="material-symbols-rounded">laptop_mac</span>
              <span>macOS 13+</span>
            </div>
            <div class="platform-item">
              <span class="material-symbols-rounded">android</span>
              <span>Android 9+</span>
            </div>
            <div class="platform-item">
              <span class="material-symbols-rounded">computer</span>
              <span>Windows 10+</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static getUsernameInput(): string {
    const usernameInput = document.querySelector<any>('#username');
    return usernameInput?.value.trim() || '';
  }
}
