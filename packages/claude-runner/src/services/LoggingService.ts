import {
	createWriteStream,
	mkdirSync,
	type WriteStream,
	writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";

/**
 * Logging configuration
 */
export interface LoggingConfig {
	cyrusHome: string;
	workspaceName: string;
	sessionId: string | null;
	workingDirectory?: string;
	promptVersions?: {
		userPromptVersion?: string;
		systemPromptVersion?: string;
	};
}

/**
 * Logging Service
 * Single Responsibility: Manage all session logging operations
 */
export class LoggingService {
	private logStream: WriteStream | null = null;
	private readableLogStream: WriteStream | null = null;
	private config: LoggingConfig;

	constructor(config: LoggingConfig) {
		this.config = config;
	}

	/**
	 * Initialize logging streams
	 */
	public initialize(): void {
		try {
			// Close existing streams if re-initializing
			this.close();

			const logsDir = join(this.config.cyrusHome, "logs");
			const workspaceLogsDir = join(logsDir, this.config.workspaceName);

			// Create directories
			mkdirSync(workspaceLogsDir, { recursive: true });

			// Create log files with session ID and timestamp
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const sessionId = this.config.sessionId || "pending";

			// Detailed JSON log
			const detailedLogFileName = `session-${sessionId}-${timestamp}.jsonl`;
			const detailedLogPath = join(workspaceLogsDir, detailedLogFileName);

			// Human-readable log
			const readableLogFileName = `session-${sessionId}-${timestamp}.md`;
			const readableLogPath = join(workspaceLogsDir, readableLogFileName);

			console.log(`[LoggingService] Creating detailed log: ${detailedLogPath}`);
			console.log(`[LoggingService] Creating readable log: ${readableLogPath}`);

			this.logStream = createWriteStream(detailedLogPath, { flags: "a" });
			this.readableLogStream = createWriteStream(readableLogPath, {
				flags: "a",
			});

			// Write metadata
			this.writeMetadata();
			this.writeReadableHeader();
		} catch (error) {
			console.error("[LoggingService] Failed to initialize:", error);
		}
	}

	/**
	 * Update session ID and re-initialize streams
	 */
	public updateSessionId(sessionId: string): void {
		this.config.sessionId = sessionId;
		this.initialize();
	}

	/**
	 * Update prompt versions and write version file
	 */
	public updatePromptVersions(versions: {
		userPromptVersion?: string;
		systemPromptVersion?: string;
	}): void {
		this.config.promptVersions = versions;

		if (!this.logStream) return;

		try {
			const logsDir = join(this.config.cyrusHome, "logs");
			const workspaceLogsDir = join(logsDir, this.config.workspaceName);
			const sessionId = this.config.sessionId || "pending";

			const versionFileName = `session-${sessionId}-versions.txt`;
			const versionFilePath = join(workspaceLogsDir, versionFileName);

			let versionContent = `Session: ${sessionId}\n`;
			versionContent += `Timestamp: ${new Date().toISOString()}\n`;
			versionContent += `Workspace: ${this.config.workspaceName}\n`;
			versionContent += "\nPrompt Template Versions:\n";

			if (versions.userPromptVersion) {
				versionContent += `User Prompt: ${versions.userPromptVersion}\n`;
			}
			if (versions.systemPromptVersion) {
				versionContent += `System Prompt: ${versions.systemPromptVersion}\n`;
			}

			writeFileSync(versionFilePath, versionContent);
			console.log(
				`[LoggingService] Wrote prompt versions to: ${versionFilePath}`,
			);
		} catch (error) {
			console.error("[LoggingService] Failed to write version file:", error);
		}
	}

	/**
	 * Log an SDK message
	 */
	public logMessage(message: SDKMessage): void {
		// Write to detailed JSON log
		if (this.logStream) {
			const logEntry = {
				type: "sdk-message",
				message,
				timestamp: new Date().toISOString(),
			};
			this.logStream.write(`${JSON.stringify(logEntry)}\n`);
		}

		// Write to human-readable log
		if (this.readableLogStream) {
			this.writeReadableLogEntry(message);
		}
	}

	/**
	 * Close all logging streams
	 */
	public close(): void {
		if (this.logStream) {
			this.logStream.end();
			this.logStream = null;
		}
		if (this.readableLogStream) {
			this.readableLogStream.end();
			this.readableLogStream = null;
		}
	}

	/**
	 * Write metadata to detailed log
	 */
	private writeMetadata(): void {
		if (!this.logStream) return;

		const metadata = {
			type: "session-metadata",
			sessionId: this.config.sessionId,
			startedAt: new Date().toISOString(),
			workingDirectory: this.config.workingDirectory,
			workspaceName: this.config.workspaceName,
			promptVersions: this.config.promptVersions,
			timestamp: new Date().toISOString(),
		};
		this.logStream.write(`${JSON.stringify(metadata)}\n`);
	}

	/**
	 * Write header to readable log
	 */
	private writeReadableHeader(): void {
		if (!this.readableLogStream) return;

		const sessionId = this.config.sessionId || "pending";
		const readableHeader =
			`# Claude Session Log\n\n` +
			`**Session ID:** ${sessionId}\n` +
			`**Started:** ${new Date().toISOString()}\n` +
			`**Workspace:** ${this.config.workspaceName}\n` +
			`**Working Directory:** ${this.config.workingDirectory || "Not set"}\n\n` +
			`---\n\n`;

		this.readableLogStream.write(readableHeader);
	}

	/**
	 * Write a human-readable log entry for a message
	 */
	private writeReadableLogEntry(message: SDKMessage): void {
		if (!this.readableLogStream) return;

		const timestamp = new Date().toISOString().substring(11, 19);

		try {
			switch (message.type) {
				case "assistant":
					if (
						message.message?.content &&
						Array.isArray(message.message.content)
					) {
						// Extract text content only
						const textBlocks = message.message.content
							.filter((block) => block.type === "text")
							.map((block) => (block as { text: string }).text)
							.join("");

						if (textBlocks.trim()) {
							this.readableLogStream.write(
								`## ${timestamp} - Claude Response\n\n${textBlocks.trim()}\n\n`,
							);
						}

						// Log tool usage in a clean format
						const toolBlocks = message.message.content
							.filter((block) => block.type === "tool_use")
							.filter(
								(block) => (block as { name: string }).name !== "TodoWrite",
							);

						if (toolBlocks.length > 0) {
							for (const tool of toolBlocks) {
								const toolWithName = tool as {
									name: string;
									input?: Record<string, unknown>;
								};
								this.readableLogStream.write(
									`### ${timestamp} - Tool: ${toolWithName.name}\n\n`,
								);
								if (
									toolWithName.input &&
									typeof toolWithName.input === "object"
								) {
									const inputStr = Object.entries(toolWithName.input)
										.map(([key, value]) => `- **${key}**: ${value}`)
										.join("\n");
									this.readableLogStream.write(`${inputStr}\n\n`);
								}
							}
						}
					}
					break;

				case "user":
					if (
						message.message?.content &&
						Array.isArray(message.message.content)
					) {
						const userContent = message.message.content
							.filter((block) => block.type === "text")
							.map((block) => (block as { text: string }).text)
							.join("");

						if (userContent.trim()) {
							this.readableLogStream.write(
								`## ${timestamp} - User\n\n${userContent.trim()}\n\n`,
							);
						}
					}
					break;

				case "result":
					if (message.subtype === "success") {
						this.readableLogStream.write(
							`## ${timestamp} - Session Complete\n\n`,
						);
						if (message.duration_ms) {
							this.readableLogStream.write(
								`**Duration**: ${message.duration_ms}ms\n`,
							);
						}
						if (message.total_cost_usd) {
							this.readableLogStream.write(
								`**Cost**: $${message.total_cost_usd.toFixed(4)}\n`,
							);
						}
						this.readableLogStream.write(`\n---\n\n`);
					}
					break;

				default:
					break;
			}
		} catch (error) {
			console.error(
				"[LoggingService] Error writing readable log entry:",
				error,
			);
		}
	}
}
