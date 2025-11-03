import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import type { EdgeConfig } from "../config-types.js";
import { Result } from "../domain/Result.js";

/**
 * Configuration Service
 * Single Responsibility: Manage all configuration file operations
 */
export class ConfigurationService {
	private readonly configPath: string;
	private readonly legacyConfigPath: string;

	constructor(cyrusHome: string, workingDirectory?: string) {
		this.configPath = resolve(cyrusHome, "config.json");
		this.legacyConfigPath = workingDirectory
			? resolve(workingDirectory, ".edge-config.json")
			: "";
	}

	/**
	 * Load configuration with automatic migration from legacy location
	 */
	public load(): Result<EdgeConfig, Error> {
		return Result.from(() => {
			// Attempt migration if needed
			this.migrateIfNeeded();

			// Load config or return default
			if (!existsSync(this.configPath)) {
				return { repositories: [] };
			}

			const content = readFileSync(this.configPath, "utf-8");
			const config = JSON.parse(content) as EdgeConfig;

			// Strip promptTemplatePath to ensure built-in templates are used
			if (config.repositories) {
				config.repositories = config.repositories.map((repo) => {
					const { promptTemplatePath, ...repoWithoutTemplate } = repo;
					if (promptTemplatePath) {
						console.log(
							`[ConfigurationService] Ignoring custom prompt template for repository: ${repo.name}`,
						);
					}
					return repoWithoutTemplate;
				});
			}

			return config;
		});
	}

	/**
	 * Save configuration to disk
	 */
	public save(config: EdgeConfig): Result<void, Error> {
		return Result.from(() => {
			const configDir = dirname(this.configPath);

			// Ensure directory exists
			if (!existsSync(configDir)) {
				mkdirSync(configDir, { recursive: true });
			}

			writeFileSync(this.configPath, JSON.stringify(config, null, 2));
		});
	}

	/**
	 * Get the current config file path
	 */
	public getConfigPath(): string {
		return this.configPath;
	}

	/**
	 * Check if configuration exists
	 */
	public exists(): boolean {
		return existsSync(this.configPath);
	}

	/**
	 * Migrate configuration from legacy location if needed
	 */
	private migrateIfNeeded(): void {
		// If new config already exists or no legacy path configured, no migration needed
		if (existsSync(this.configPath) || !this.legacyConfigPath) {
			return;
		}

		// If legacy config doesn't exist, no migration needed
		if (!existsSync(this.legacyConfigPath)) {
			return;
		}

		try {
			// Ensure the directory exists
			const configDir = dirname(this.configPath);
			if (!existsSync(configDir)) {
				mkdirSync(configDir, { recursive: true });
			}

			// Copy the legacy config to the new location
			copyFileSync(this.legacyConfigPath, this.configPath);

			console.log(
				`📦 [ConfigurationService] Migrated configuration from ${this.legacyConfigPath} to ${this.configPath}`,
			);
			console.log(
				`💡 [ConfigurationService] You can safely remove the old file if desired`,
			);
		} catch (error) {
			console.warn(
				`⚠️ [ConfigurationService] Failed to migrate config from ${this.legacyConfigPath}:`,
				(error as Error).message,
			);
			console.warn(
				`   Please manually copy your configuration to ${this.configPath}`,
			);
		}
	}
}
