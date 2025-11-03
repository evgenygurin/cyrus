/**
 * Base error class for all Cyrus errors
 * Provides consistent error handling across the application
 */
export abstract class BaseError extends Error {
	public readonly timestamp: Date;
	public readonly context?: Record<string, unknown>;

	constructor(message: string, context?: Record<string, unknown>) {
		super(message);
		this.name = this.constructor.name;
		this.timestamp = new Date();
		this.context = context;

		// Maintains proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}

	/**
	 * Get a serializable representation of the error
	 */
	toJSON(): Record<string, unknown> {
		return {
			name: this.name,
			message: this.message,
			timestamp: this.timestamp.toISOString(),
			context: this.context,
			stack: this.stack,
		};
	}

	/**
	 * Check if this error is retryable
	 */
	abstract isRetryable(): boolean;

	/**
	 * Get the error severity level
	 */
	abstract getSeverity(): ErrorSeverity;
}

export enum ErrorSeverity {
	LOW = "low",
	MEDIUM = "medium",
	HIGH = "high",
	CRITICAL = "critical",
}
