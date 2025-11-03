import { BaseError } from "./BaseError.js";

export interface RetryConfig {
	maxAttempts: number;
	initialDelayMs: number;
	maxDelayMs: number;
	backoffMultiplier: number;
	retryableErrors?: Array<new (...args: any[]) => Error>;
}

export class ErrorHandler {
	private static readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
		maxAttempts: 3,
		initialDelayMs: 1000,
		maxDelayMs: 30000,
		backoffMultiplier: 2,
	};

	/**
	 * Execute an operation with automatic retry logic
	 */
	static async withRetry<T>(
		operation: () => Promise<T>,
		config: Partial<RetryConfig> = {},
	): Promise<T> {
		const finalConfig = { ...ErrorHandler.DEFAULT_RETRY_CONFIG, ...config };
		let lastError: Error | undefined;
		let delay = finalConfig.initialDelayMs;

		for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
			try {
				return await operation();
			} catch (error) {
				lastError = error as Error;

				// Check if error is retryable
				const isRetryable = ErrorHandler.isRetryableError(
					error as Error,
					finalConfig,
				);

				// If this was the last attempt or error is not retryable, throw
				if (attempt === finalConfig.maxAttempts || !isRetryable) {
					throw error;
				}

				// Wait before retrying with exponential backoff
				await ErrorHandler.sleep(Math.min(delay, finalConfig.maxDelayMs));
				delay *= finalConfig.backoffMultiplier;
			}
		}

		// This should never be reached, but TypeScript needs it
		throw lastError || new Error("Operation failed after all retry attempts");
	}

	/**
	 * Execute an operation with timeout
	 */
	static async withTimeout<T>(
		operation: () => Promise<T>,
		timeoutMs: number,
		timeoutMessage?: string,
	): Promise<T> {
		return Promise.race([
			operation(),
			ErrorHandler.timeout(timeoutMs, timeoutMessage),
		]);
	}

	/**
	 * Execute an operation with both retry and timeout
	 */
	static async withRetryAndTimeout<T>(
		operation: () => Promise<T>,
		timeoutMs: number,
		retryConfig: Partial<RetryConfig> = {},
	): Promise<T> {
		return ErrorHandler.withRetry(
			() => ErrorHandler.withTimeout(operation, timeoutMs),
			retryConfig,
		);
	}

	/**
	 * Check if an error is retryable
	 */
	private static isRetryableError(error: Error, config: RetryConfig): boolean {
		// If specific retryable errors are configured, check against them
		if (config.retryableErrors && config.retryableErrors.length > 0) {
			return config.retryableErrors.some(
				(ErrorClass) => error instanceof ErrorClass,
			);
		}

		// Check if it's a BaseError with retry logic
		if (error instanceof BaseError) {
			return error.isRetryable();
		}

		// Default: retry on common transient errors
		const retryableMessages = [
			"ECONNRESET",
			"ETIMEDOUT",
			"ECONNREFUSED",
			"ENETUNREACH",
			"EAI_AGAIN",
			"rate limit",
			"too many requests",
		];

		return retryableMessages.some((msg) =>
			error.message.toLowerCase().includes(msg.toLowerCase()),
		);
	}

	/**
	 * Create a timeout promise
	 */
	private static timeout(ms: number, message?: string): Promise<never> {
		return new Promise((_, reject) => {
			setTimeout(() => {
				reject(new Error(message || `Operation timed out after ${ms}ms`));
			}, ms);
		});
	}

	/**
	 * Sleep for a specified duration
	 */
	private static sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Wrap an error with additional context
	 */
	static wrapError(
		error: Error,
		message: string,
		context?: Record<string, unknown>,
	): Error {
		const wrappedError = new Error(message);
		wrappedError.cause = error;
		wrappedError.stack = `${wrappedError.stack}\nCaused by: ${error.stack}`;

		// Add context if available
		if (context) {
			Object.assign(wrappedError, { context });
		}

		return wrappedError;
	}
}
