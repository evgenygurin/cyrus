import { ZodError } from "zod";
import { ValidationError } from "../errors/index.js";
import {
	type EdgeConfig,
	EdgeConfigSchema,
	type EdgeWorkerConfig,
	EdgeWorkerConfigSchema,
	type RepositoryConfig,
	RepositoryConfigSchema,
} from "./ConfigSchemas.js";

/**
 * Configuration validator using Zod schemas
 */
export class ConfigValidator {
	/**
	 * Validate repository configuration
	 */
	static validateRepositoryConfig(data: unknown): RepositoryConfig {
		try {
			return RepositoryConfigSchema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new ValidationError(
					"Repository configuration validation failed",
					error.errors.map((e) => ({
						field: e.path.join("."),
						message: e.message,
					})),
				);
			}
			throw error;
		}
	}

	/**
	 * Validate EdgeWorker configuration
	 */
	static validateEdgeWorkerConfig(data: unknown): EdgeWorkerConfig {
		try {
			return EdgeWorkerConfigSchema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new ValidationError(
					"EdgeWorker configuration validation failed",
					error.errors.map((e) => ({
						field: e.path.join("."),
						message: e.message,
					})),
				);
			}
			throw error;
		}
	}

	/**
	 * Validate Edge configuration
	 */
	static validateEdgeConfig(data: unknown): EdgeConfig {
		try {
			return EdgeConfigSchema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new ValidationError(
					"Edge configuration validation failed",
					error.errors.map((e) => ({
						field: e.path.join("."),
						message: e.message,
					})),
				);
			}
			throw error;
		}
	}

	/**
	 * Safely parse repository configuration (returns undefined on failure)
	 */
	static safeParseRepositoryConfig(
		data: unknown,
	): RepositoryConfig | undefined {
		const result = RepositoryConfigSchema.safeParse(data);
		return result.success ? result.data : undefined;
	}

	/**
	 * Safely parse EdgeWorker configuration (returns undefined on failure)
	 */
	static safeParseEdgeWorkerConfig(
		data: unknown,
	): EdgeWorkerConfig | undefined {
		const result = EdgeWorkerConfigSchema.safeParse(data);
		return result.success ? result.data : undefined;
	}

	/**
	 * Safely parse Edge configuration (returns undefined on failure)
	 */
	static safeParseEdgeConfig(data: unknown): EdgeConfig | undefined {
		const result = EdgeConfigSchema.safeParse(data);
		return result.success ? result.data : undefined;
	}
}
