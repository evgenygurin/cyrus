import type { ICommand } from "./ICommand.js";

/**
 * Registry for managing CLI commands
 *
 * Implements the Command Pattern by maintaining a registry of
 * available commands and routing execution to the appropriate command.
 */
export class CommandRegistry {
	private commands: Map<string, ICommand> = new Map();

	/**
	 * Register a command
	 */
	register(command: ICommand): void {
		if (this.commands.has(command.name)) {
			throw new Error(`Command '${command.name}' is already registered`);
		}
		this.commands.set(command.name, command);
	}

	/**
	 * Get a command by name
	 */
	get(name: string): ICommand | undefined {
		return this.commands.get(name);
	}

	/**
	 * Check if a command exists
	 */
	has(name: string): boolean {
		return this.commands.has(name);
	}

	/**
	 * Get all registered command names
	 */
	getNames(): string[] {
		return Array.from(this.commands.keys());
	}

	/**
	 * Get all registered commands
	 */
	getAll(): ICommand[] {
		return Array.from(this.commands.values());
	}

	/**
	 * Execute a command by name
	 */
	async execute(name: string, args: string[]): Promise<void> {
		const command = this.commands.get(name);
		if (!command) {
			throw new Error(
				`Unknown command: ${name}. Run 'cyrus --help' for available commands.`,
			);
		}
		await command.execute(args);
	}

	/**
	 * Generate help text for all commands
	 */
	generateHelp(): string {
		const commands = this.getAll();
		if (commands.length === 0) {
			return "No commands available.";
		}

		const maxNameLength = Math.max(...commands.map((cmd) => cmd.name.length));
		const lines = commands.map((cmd) => {
			const padding = " ".repeat(maxNameLength - cmd.name.length + 2);
			return `  ${cmd.name}${padding}${cmd.description}`;
		});

		return lines.join("\n");
	}
}
