/**
 * Command interface following the Command Pattern
 *
 * Each CLI command implements this interface to provide:
 * - A name for routing
 * - A description for help text
 * - An execute method for running the command
 */
export interface ICommand {
	/**
	 * The command name (e.g., "check-tokens", "add-repository")
	 */
	readonly name: string;

	/**
	 * A short description of what the command does
	 */
	readonly description: string;

	/**
	 * Execute the command with given arguments
	 * @param args Command-line arguments (excluding the command name itself)
	 * @returns Promise that resolves when command completes
	 */
	execute(args: string[]): Promise<void>;
}

/**
 * Base class for commands that provides common functionality
 */
export abstract class BaseCommand implements ICommand {
	abstract readonly name: string;
	abstract readonly description: string;

	/**
	 * Execute the command
	 */
	abstract execute(args: string[]): Promise<void>;

	/**
	 * Helper to exit with error message
	 */
	protected exitWithError(message: string, code = 1): never {
		console.error(message);
		process.exit(code);
	}

	/**
	 * Helper to log success message
	 */
	protected logSuccess(message: string): void {
		console.log(`✅ ${message}`);
	}

	/**
	 * Helper to log info message
	 */
	protected logInfo(message: string): void {
		console.log(message);
	}

	/**
	 * Helper to log error message
	 */
	protected logError(message: string): void {
		console.error(`❌ ${message}`);
	}
}
