// src/utils/errorMessages.ts

export interface ApiError {
  status?: number;
  code?: string;
  message?: string;
  details?: any;
}

export class ErrorMessageHandler {
  // Map of common error codes to user-friendly German messages
  private static readonly ERROR_MESSAGES: Record<string, string> = {
    // Authentication errors
    'INVALID_CREDENTIALS': 'Benutzername oder Passwort ist falsch.',
    'USER_NOT_FOUND': 'Benutzer wurde nicht gefunden.',
    'USER_DISABLED': 'Ihr Konto wurde deaktiviert. Wenden Sie sich an den Administrator.',
    'USER_LOCKED': 'Ihr Konto wurde temporär gesperrt. Versuchen Sie es später erneut.',
    'ACCOUNT_EXPIRED': 'Ihr Konto ist abgelaufen. Wenden Sie sich an den Administrator.',
    'PASSWORD_EXPIRED': 'Ihr Passwort ist abgelaufen. Bitte setzen Sie es zurück.',
    'TOO_MANY_ATTEMPTS': 'Zu viele Anmeldeversuche. Bitte warten Sie einige Minuten.',
    'SESSION_EXPIRED': 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.',
    
    // Validation errors
    'VALIDATION_ERROR': 'Die eingegebenen Daten sind ungültig.',
    'MISSING_REQUIRED_FIELD': 'Pflichtfelder sind nicht ausgefüllt.',
    'INVALID_EMAIL_FORMAT': 'Die E-Mail-Adresse hat ein ungültiges Format.',
    'WEAK_PASSWORD': 'Das Passwort erfüllt nicht die Sicherheitsanforderungen.',
    
    // Network errors
    'NETWORK_ERROR': 'Netzwerkfehler. Überprüfen Sie Ihre Internetverbindung.',
    'SERVER_UNREACHABLE': 'Server ist nicht erreichbar. Versuchen Sie es später erneut.',
    'REQUEST_TIMEOUT': 'Anfrage-Timeout. Versuchen Sie es erneut.',
    
    // Server errors
    'INTERNAL_SERVER_ERROR': 'Ein unerwarteter Fehler ist aufgetreten. Versuchen Sie es später erneut.',
    'SERVICE_UNAVAILABLE': 'Der Service ist vorübergehend nicht verfügbar.',
    'MAINTENANCE_MODE': 'Das System befindet sich im Wartungsmodus.',
    
    // Permission errors
    'INSUFFICIENT_PERMISSIONS': 'Sie haben keine Berechtigung für diese Aktion.',
    'ROLE_REQUIRED': 'Eine höhere Berechtigung ist für diese Aktion erforderlich.',
  };

  // Map HTTP status codes to generic messages
  private static readonly STATUS_MESSAGES: Record<number, string> = {
    400: 'Ungültige Anfrage. Überprüfen Sie Ihre Eingaben.',
    401: 'Anmeldung fehlgeschlagen. Überprüfen Sie Ihre Zugangsdaten.',
    403: 'Zugriff verweigert. Sie haben keine Berechtigung für diese Aktion.',
    404: 'Die angeforderte Ressource wurde nicht gefunden.',
    408: 'Anfrage-Timeout. Versuchen Sie es erneut.',
    409: 'Konflikt. Die Aktion kann nicht ausgeführt werden.',
    422: 'Die Daten konnten nicht verarbeitet werden.',
    429: 'Zu viele Anfragen. Bitte warten Sie einen Moment.',
    500: 'Interner Serverfehler. Versuchen Sie es später erneut.',
    502: 'Bad Gateway. Der Server ist vorübergehend nicht verfügbar.',
    503: 'Service nicht verfügbar. Versuchen Sie es später erneut.',
    504: 'Gateway Timeout. Der Server antwortet nicht.',
  };

  /**
   * Get a user-friendly error message from an API error
   */
  static getErrorMessage(error: any): string {
    // Handle axios errors
    if (error?.response) {
      const { status, data } = error.response;
      
      // Check for specific error code in response
      if (data?.code && this.ERROR_MESSAGES[data.code]) {
        return this.ERROR_MESSAGES[data.code];
      }
      
      // Check for message in response data
      if (data?.message) {
        return this.formatServerMessage(data.message);
      }
      
      // Check for error array (validation errors)
      if (data?.errors && Array.isArray(data.errors)) {
        return this.formatValidationErrors(data.errors);
      }
      
      // Fall back to status code message
      if (this.STATUS_MESSAGES[status]) {
        return this.STATUS_MESSAGES[status];
      }
      
      return `Fehler ${status}: ${data?.error || 'Unbekannter Fehler'}`;
    }
    
    // Handle network errors
    if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
      return this.ERROR_MESSAGES.NETWORK_ERROR;
    }
    
    // Handle timeout errors
    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      return this.ERROR_MESSAGES.REQUEST_TIMEOUT;
    }
    
    // Handle custom error objects
    if (error?.code && this.ERROR_MESSAGES[error.code]) {
      return this.ERROR_MESSAGES[error.code];
    }
    
    // Fall back to generic message
    return error?.message || 'Ein unerwarteter Fehler ist aufgetreten.';
  }

  /**
   * Format server error messages to be more user-friendly
   */
  private static formatServerMessage(message: string): string {
    // Common server message mappings
    const messageMap: Record<string, string> = {
      'Bad credentials': 'Benutzername oder Passwort ist falsch.',
      'User not found': 'Benutzer wurde nicht gefunden.',
      'User is disabled': 'Ihr Konto wurde deaktiviert.',
      'Account is locked': 'Ihr Konto wurde gesperrt.',
      'Invalid token': 'Ungültiger Anmelde-Token.',
      'Token expired': 'Ihr Anmelde-Token ist abgelaufen.',
      'Access denied': 'Zugriff verweigert.',
    };
    
    // Check for exact matches
    if (messageMap[message]) {
      return messageMap[message];
    }
    
    // Check for partial matches
    for (const [key, value] of Object.entries(messageMap)) {
      if (message.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    
    // Return original message if no mapping found
    return message;
  }

  /**
   * Format validation errors into a readable message
   */
  private static formatValidationErrors(errors: any[]): string {
    if (errors.length === 1) {
      return `Fehler: ${errors[0].message || errors[0]}`;
    }
    
    const errorList = errors
      .map(error => error.message || error)
      .slice(0, 3) // Show max 3 errors
      .join(', ');
    
    const remaining = errors.length - 3;
    const suffix = remaining > 0 ? ` und ${remaining} weitere` : '';
    
    return `Mehrere Fehler: ${errorList}${suffix}`;
  }

  /**
   * Get specific error message for login failures
   */
  static getLoginErrorMessage(error: any): string {
    const message = this.getErrorMessage(error);
    
    // If it's a generic 401, provide more specific login context
    if (error?.response?.status === 401 && !error?.response?.data?.code) {
      return 'Anmeldung fehlgeschlagen. Überprüfen Sie Ihren Benutzernamen und Ihr Passwort.';
    }
    
    return message;
  }

  /**
   * Determine if an error should show a retry button
   */
  static shouldShowRetry(error: any): boolean {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    const retryCodes = ['NETWORK_ERROR', 'REQUEST_TIMEOUT', 'SERVER_UNREACHABLE'];
    
    if (error?.response?.status && retryableStatuses.includes(error.response.status)) {
      return true;
    }
    
    if (error?.code && retryCodes.includes(error.code)) {
      return true;
    }
    
    return false;
  }

  /**
   * Get appropriate error icon for the error type
   */
  static getErrorIcon(error: any): 'warning' | 'error' | 'info' {
    if (error?.response?.status === 401 || error?.code === 'INVALID_CREDENTIALS') {
      return 'warning';
    }
    
    if (error?.response?.status >= 500 || error?.code === 'NETWORK_ERROR') {
      return 'error';
    }
    
    return 'info';
  }
}

// Export commonly used functions
export const getErrorMessage = ErrorMessageHandler.getErrorMessage;
export const getLoginErrorMessage = ErrorMessageHandler.getLoginErrorMessage;
export const shouldShowRetry = ErrorMessageHandler.shouldShowRetry;
export const getErrorIcon = ErrorMessageHandler.getErrorIcon;