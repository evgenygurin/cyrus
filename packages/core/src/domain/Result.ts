/**
 * Result type for functional error handling
 * Replaces try-catch with explicit success/failure handling
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

export class Success<T> {
	readonly isSuccess = true;
	readonly isFailure = false;

	constructor(readonly value: T) {}

	map<U>(fn: (value: T) => U): Result<U, never> {
		return new Success(fn(this.value));
	}

	flatMap<U, E>(fn: (value: T) => Result<U, E>): Result<U, E> {
		return fn(this.value);
	}

	mapError<F>(_fn: (error: never) => F): Result<T, F> {
		return this as any;
	}

	unwrap(): T {
		return this.value;
	}

	unwrapOr(_defaultValue: T): T {
		return this.value;
	}

	match<U>(patterns: {
		success: (value: T) => U;
		failure: (error: never) => U;
	}): U {
		return patterns.success(this.value);
	}
}

export class Failure<E> {
	readonly isSuccess = false;
	readonly isFailure = true;

	constructor(readonly error: E) {}

	map<U>(_fn: (value: never) => U): Result<U, E> {
		return this as any;
	}

	flatMap<U>(_fn: (value: never) => Result<U, E>): Result<U, E> {
		return this as any;
	}

	mapError<F>(fn: (error: E) => F): Result<never, F> {
		return new Failure(fn(this.error));
	}

	unwrap(): never {
		throw new Error(
			`Cannot unwrap a Failure: ${this.error instanceof Error ? this.error.message : String(this.error)}`,
		);
	}

	unwrapOr<T>(defaultValue: T): T {
		return defaultValue;
	}

	match<U>(patterns: {
		success: (value: never) => U;
		failure: (error: E) => U;
	}): U {
		return patterns.failure(this.error);
	}
}

/**
 * Helper functions to create Results
 */
export const Result = {
	success: <T>(value: T): Result<T, never> => new Success(value),
	failure: <E>(error: E): Result<never, E> => new Failure(error),
	from: <T>(fn: () => T): Result<T, Error> => {
		try {
			return new Success(fn());
		} catch (error) {
			return new Failure(
				error instanceof Error ? error : new Error(String(error)),
			);
		}
	},
	fromAsync: async <T>(fn: () => Promise<T>): Promise<Result<T, Error>> => {
		try {
			return new Success(await fn());
		} catch (error) {
			return new Failure(
				error instanceof Error ? error : new Error(String(error)),
			);
		}
	},
};
