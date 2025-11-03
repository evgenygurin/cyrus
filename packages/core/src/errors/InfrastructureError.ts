import { BaseError, ErrorSeverity } from "./BaseError.js";

/**
 * Infrastructure-level errors (external services, network, etc.)
 */
export class InfrastructureError extends BaseError {
	isRetryable(): boolean {
		return true; // Infrastructure errors are often retryable
	}

	getSeverity(): ErrorSeverity {
		return ErrorSeverity.MEDIUM;
	}
}

/**
 * Linear API error
 */
export class LinearAPIError extends InfrastructureError {
	constructor(
		message: string,
		public readonly statusCode?: number,
		context?: Record<string, unknown>,
	) {
		super(`Linear API error: ${message}`, { ...context, statusCode });
	}

	isRetryable(): boolean {
		// Retry on 5xx errors and rate limiting
		return (
			this.statusCode === undefined ||
			this.statusCode >= 500 ||
			this.statusCode === 429
		);
	}

	getSeverity(): ErrorSeverity {
		if (this.statusCode && this.statusCode >= 500) {
			return ErrorSeverity.HIGH;
		}
		return ErrorSeverity.MEDIUM;
	}
}

/**
 * Claude API error
 */
export class ClaudeAPIError extends InfrastructureError {
	constructor(
		message: string,
		public readonly statusCode?: number,
		context?: Record<string, unknown>,
	) {
		super(`Claude API error: ${message}`, { ...context, statusCode });
	}

	isRetryable(): boolean {
		// Retry on 5xx errors and rate limiting
		return (
			this.statusCode === undefined ||
			this.statusCode >= 500 ||
			this.statusCode === 429
		);
	}

	getSeverity(): ErrorSeverity {
		if (this.statusCode && this.statusCode >= 500) {
			return ErrorSeverity.HIGH;
		}
		return ErrorSeverity.MEDIUM;
	}
}

/**
 * Git operation error
 */
export class GitOperationError extends InfrastructureError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(`Git operation error: ${message}`, context);
	}

	isRetryable(): boolean {
		// Git operations might be retryable (e.g., network issues)
		return true;
	}
}

/**
 * Network error
 */
export class NetworkError extends InfrastructureError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(`Network error: ${message}`, context);
	}

	getSeverity(): ErrorSeverity {
		return ErrorSeverity.HIGH;
	}
}

/**
 * Timeout error
 */
export class TimeoutError extends InfrastructureError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(`Timeout: ${message}`, context);
	}

	isRetryable(): boolean {
		return true;
	}
}
