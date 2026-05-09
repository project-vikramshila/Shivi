/**
 * Privacy Filter - Data Sanitization and Filtering
 * Ensures no sensitive data is sent to cloud AI
 */

export interface PrivacyCheck {
  allowed: boolean;
  reason: string;
  sanitizedMessage?: string;
}

export interface PrivacyRequest {
  message: string;
  context: string[];
  privacyLevel: 'strict' | 'moderate' | 'relaxed';
}

export class PrivacyFilter {
  private static instance: PrivacyFilter;

  static getInstance(): PrivacyFilter {
    if (!PrivacyFilter.instance) {
      PrivacyFilter.instance = new PrivacyFilter();
    }
    return PrivacyFilter.instance;
  }

  async checkRequest(request: PrivacyRequest): Promise<PrivacyCheck> {
    // Strict mode - block everything sensitive
    if (request.privacyLevel === 'strict') {
      const hasSensitive = this.containsSensitiveData(request.message);
      if (hasSensitive) {
        return {
          allowed: false,
          reason: 'strict_privacy_mode'
        };
      }
    }

    // Check for sensitive patterns
    const sensitivePatterns = [
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
      /\b\d{10,12}\b/, // Phone numbers
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b(?:password|token|secret|key|auth)\b/i, // Auth keywords
      /\b(?:bank|account|financial|money)\b/i, // Financial
      /\b(?:whatsapp|telegram|chat)\b.*?(?:message|conversation)/i, // Chat content
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(request.message)) {
        if (request.privacyLevel === 'moderate') {
          // Sanitize instead of blocking
          const sanitized = this.sanitizeMessage(request.message, pattern);
          return {
            allowed: true,
            reason: 'sanitized',
            sanitizedMessage: sanitized
          };
        } else {
          return {
            allowed: false,
            reason: 'contains_sensitive_data'
          };
        }
      }
    }

    // Check context for sensitive data
    for (const ctx of request.context) {
      if (this.containsSensitiveData(ctx)) {
        return {
          allowed: false,
          reason: 'sensitive_context'
        };
      }
    }

    return {
      allowed: true,
      reason: 'clean'
    };
  }

  private containsSensitiveData(text: string): boolean {
    const sensitiveKeywords = [
      'password', 'token', 'secret', 'key', 'auth', 'login',
      'bank', 'account', 'credit', 'debit', 'financial',
      'whatsapp', 'telegram', 'private', 'confidential'
    ];

    const lowerText = text.toLowerCase();
    return sensitiveKeywords.some(keyword => lowerText.includes(keyword));
  }

  private sanitizeMessage(message: string, pattern: RegExp): string {
    return message.replace(pattern, '[REDACTED]');
  }

  async sanitizeContext(context: string[]): Promise<string[]> {
    return context.map(msg => {
      // Remove or redact sensitive parts
      return msg.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]')
                .replace(/\b\d{10,12}\b/g, '[PHONE]')
                .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
    });
  }
}

export const privacyFilter = PrivacyFilter.getInstance();