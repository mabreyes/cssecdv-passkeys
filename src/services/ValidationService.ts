export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ValidationService {
  private static readonly USERNAME_MIN_LENGTH = 3;
  private static readonly USERNAME_MAX_LENGTH = 20;
  private static readonly USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
  private static readonly RESERVED_USERNAMES = [
    'admin',
    'administrator',
    'root',
    'user',
    'test',
    'demo',
    'api',
    'www',
    'mail',
    'email',
    'support',
    'help',
    'info',
    'contact',
    'service',
    'system',
    'null',
    'undefined',
    'guest',
    'anonymous',
  ];

  static validateUsername(username: string): ValidationResult {
    const errors: string[] = [];

    // Check if empty
    if (!username || !username.trim()) {
      errors.push('Username is required');
      return { isValid: false, errors };
    }

    const trimmedUsername = username.trim();

    // Check length
    if (trimmedUsername.length < this.USERNAME_MIN_LENGTH) {
      errors.push(
        `Username must be at least ${this.USERNAME_MIN_LENGTH} characters long`
      );
    }

    if (trimmedUsername.length > this.USERNAME_MAX_LENGTH) {
      errors.push(
        `Username must be no more than ${this.USERNAME_MAX_LENGTH} characters long`
      );
    }

    // Check pattern (alphanumeric, underscore, hyphen only)
    if (!this.USERNAME_PATTERN.test(trimmedUsername)) {
      errors.push(
        'Username can only contain letters, numbers, underscores, and hyphens'
      );
    }

    // Check for reserved usernames
    if (this.RESERVED_USERNAMES.includes(trimmedUsername.toLowerCase())) {
      errors.push('This username is reserved and cannot be used');
    }

    // Check for consecutive special characters
    if (/[_-]{2,}/.test(trimmedUsername)) {
      errors.push('Username cannot contain consecutive underscores or hyphens');
    }

    // Check if starts or ends with special characters
    if (/^[_-]|[_-]$/.test(trimmedUsername)) {
      errors.push('Username cannot start or end with underscores or hyphens');
    }

    // Check for confusing patterns
    if (/^[0-9]+$/.test(trimmedUsername)) {
      errors.push('Username cannot be only numbers');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static async checkUsernameAvailability(
    username: string
  ): Promise<ValidationResult> {
    try {
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${API_BASE_URL}/api/check-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          isValid: false,
          errors: [data.error || 'Failed to check username availability'],
        };
      }

      return {
        isValid: data.available,
        errors: data.available ? [] : ['Username is already taken'],
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Network error while checking username availability'],
      };
    }
  }

  static async validateUsernameComplete(
    username: string
  ): Promise<ValidationResult> {
    // First do basic validation
    const basicValidation = this.validateUsername(username);
    if (!basicValidation.isValid) {
      return basicValidation;
    }

    // Then check availability
    const availabilityCheck = await this.checkUsernameAvailability(username);

    return {
      isValid: basicValidation.isValid && availabilityCheck.isValid,
      errors: [...basicValidation.errors, ...availabilityCheck.errors],
    };
  }
}
