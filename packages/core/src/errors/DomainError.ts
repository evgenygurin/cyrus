import { BaseError, ErrorSeverity } from "./BaseError.js";

/**
 * Domain-level errors (business logic violations)
 */
export class DomainError extends BaseError {
	isRetryable(): boolean {
		return false; // Domain errors are typically not retryable
	}

	getSeverity(): ErrorSeverity {
		return ErrorSeverity.MEDIUM;
	}
}

/**
 * Invalid configuration error
 */
export class InvalidConfigurationError extends DomainError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(`Configuration error: ${message}`, context);
	}

	getSeverity(): ErrorSeverity {
		return ErrorSeverity.HIGH;
	}
}

/**
 * Invalid state error (when an operation is attempted in an invalid state)
 */
export class InvalidStateError extends DomainError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(`Invalid state: ${message}`, context);
	}
}

/**
 * Validation error
 */
export class ValidationError extends DomainError {
	public readonly validationErrors: Array<{
		field: string;
		message: string;
	}>;

	constructor(
		message: string,
		validationErrors: Array<{ field: string; message: string }>,
		context?: Record<string, unknown>,
	) {
		super(message, { ...context, validationErrors });
		this.validationErrors = validationErrors;
	}
}
