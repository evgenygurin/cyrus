import "reflect-metadata";
import { Container as InversifyContainer } from "inversify";
import { ConfigValidator } from "../validation/ConfigValidator.js";
import { TYPES } from "./types.js";

/**
 * Dependency injection container
 * Provides centralized management of application dependencies
 */
export class Container {
	private static instance: InversifyContainer | null = null;

	/**
	 * Get the singleton container instance
	 */
	static getInstance(): InversifyContainer {
		if (!Container.instance) {
			Container.instance = new InversifyContainer({
				defaultScope: "Singleton",
				skipBaseClassChecks: true,
			});
			Container.registerDefaults();
		}
		return Container.instance;
	}

	/**
	 * Reset the container (useful for testing)
	 */
	static reset(): void {
		if (Container.instance) {
			Container.instance.unbindAll();
		}
		Container.instance = null;
	}

	/**
	 * Register default bindings
	 */
	private static registerDefaults(): void {
		const container = Container.instance!;

		// Register ConfigValidator
		container.bind(TYPES.ConfigValidator).toConstantValue(ConfigValidator);

		// Additional bindings can be added here as services are created
	}

	/**
	 * Create a child container (useful for request-scoped dependencies)
	 */
	static createChild(): InversifyContainer {
		return Container.getInstance().createChild();
	}
}
