import { existsSync, readFileSync } from "node:fs";
import type { EdgeConfig } from "cyrus-core";
import { BaseCommand } from "./ICommand.js";

/**
 * Command to check the status of all Linear tokens in the configuration
 *
 * This command validates each repository's Linear API token by making
 * a test API call to Linear's GraphQL endpoint.
 */
export class CheckTokensCommand extends BaseCommand {
	readonly name = "check-tokens";
	readonly description = "Check the status of all Linear tokens";

	constructor(
		_cyrusHome: string,
		private getEdgeConfigPath: () => string,
	) {
		super();
	}

	async execute(_args: string[]): Promise<void> {
		const configPath = this.getEdgeConfigPath();

		if (!existsSync(configPath)) {
			this.exitWithError(
				"No edge configuration found. Please run setup first.",
			);
		}

		const config = JSON.parse(readFileSync(configPath, "utf-8")) as EdgeConfig;

		this.logInfo("Checking Linear tokens...\n");

		for (const repo of config.repositories) {
			process.stdout.write(`${repo.name} (${repo.linearWorkspaceName}): `);
			const result = await this.checkLinearToken(repo.linearToken);

			if (result.valid) {
				console.log("✅ Valid");
			} else {
				console.log(`❌ Invalid - ${result.error}`);
			}
		}
	}

	/**
	 * Helper function to check Linear token status
	 */
	private async checkLinearToken(
		token: string,
	): Promise<{ valid: boolean; error?: string }> {
		try {
			const response = await fetch("https://api.linear.app/graphql", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: token,
				},
				body: JSON.stringify({
					query: "{ viewer { id email name } }",
				}),
			});

			const data = (await response.json()) as {
				errors?: Array<{ message: string }>;
			};

			if (data.errors) {
				return {
					valid: false,
					error: data.errors[0]?.message || "Unknown error",
				};
			}

			return { valid: true };
		} catch (error) {
			return { valid: false, error: (error as Error).message };
		}
	}
}
