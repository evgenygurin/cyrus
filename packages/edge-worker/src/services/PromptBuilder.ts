/**
 * PromptBuilder Service
 *
 * Responsible for assembling prompts for Claude based on various contexts:
 * - Label-based prompts from repository configuration
 * - Mention-based prompts from user comments
 * - System prompts based on issue labels
 *
 * This service was extracted from EdgeWorker as part of the refactoring effort
 * to improve maintainability and testability following the Single Responsibility Principle.
 *
 * @see docs/REFACTORING_PLAN.md
 */

import type { Issue as LinearIssue } from "@linear/sdk";
import type { RepositoryConfig } from "cyrus-core";

export interface LabelPromptConfig {
	labels: string[];
	prompt?: string;
}

export interface SystemPromptResult {
	systemPrompt: string;
	matchedLabels: string[];
}

/**
 * Service for building prompts based on context
 */
export class PromptBuilder {
	/**
	 * Determine system prompt from issue labels
	 *
	 * Checks labels against repository configuration and returns
	 * the appropriate system prompt if labels match.
	 *
	 * @param labels Issue labels
	 * @param repository Repository configuration
	 * @returns System prompt result with matched labels, or null if no match
	 */
	determineSystemPromptFromLabels(
		labels: string[],
		repository: RepositoryConfig,
	): SystemPromptResult | null {
		if (!repository.labelPrompts) {
			return null;
		}

		// Check each label prompt configuration
		for (const [_key, config] of Object.entries(repository.labelPrompts)) {
			// Handle both array format (just labels) and object format (labels + prompt)
			const labelConfig: LabelPromptConfig = Array.isArray(config)
				? { labels: config }
				: config;

			const matchedLabels = labelConfig.labels.filter((label) =>
				labels.includes(label),
			);

			if (matchedLabels.length > 0 && labelConfig.prompt) {
				return {
					systemPrompt: labelConfig.prompt,
					matchedLabels,
				};
			}
		}

		return null;
	}

	/**
	 * Build label-based prompt
	 *
	 * Constructs a prompt based on issue labels and repository configuration.
	 * This is used when a user explicitly requests label-based prompting
	 * via the /label-based-prompt command.
	 *
	 * @param issue Linear issue
	 * @param labels Issue labels
	 * @param repository Repository configuration
	 * @returns Object with user prompt and optional system prompt
	 */
	buildLabelBasedPrompt(
		issue: LinearIssue,
		labels: string[],
		repository: RepositoryConfig,
	): { userPrompt: string; systemPrompt?: string } {
		// Check for matching label prompts
		const systemPromptResult = this.determineSystemPromptFromLabels(
			labels,
			repository,
		);

		// Build user prompt with issue information
		const userPrompt = this.formatIssuePrompt(
			issue.identifier,
			issue.title,
			issue.description || "",
			systemPromptResult?.matchedLabels || [],
		);

		return {
			userPrompt,
			systemPrompt: systemPromptResult?.systemPrompt,
		};
	}

	/**
	 * Build mention-based prompt
	 *
	 * Constructs a prompt based on a user comment that mentions the bot.
	 *
	 * @param issue Linear issue
	 * @param commentBody User comment body
	 * @returns Object with user prompt
	 */
	buildMentionPrompt(
		issue: LinearIssue,
		commentBody: string,
	): { userPrompt: string } {
		const userPrompt = this.formatMentionPrompt(
			issue.identifier,
			issue.title,
			issue.description || "",
			commentBody,
		);

		return { userPrompt };
	}

	/**
	 * Format issue prompt with label information
	 */
	private formatIssuePrompt(
		identifier: string,
		title: string,
		description: string,
		matchedLabels: string[],
	): string {
		let prompt = `Issue: ${identifier} - ${title}\n\n`;

		if (matchedLabels.length > 0) {
			prompt += `Labels: ${matchedLabels.join(", ")}\n\n`;
		}

		if (description) {
			prompt += `Description:\n${description}\n\n`;
		}

		prompt += "Please help with this issue.";

		return prompt;
	}

	/**
	 * Format mention prompt with comment context
	 */
	private formatMentionPrompt(
		identifier: string,
		title: string,
		description: string,
		commentBody: string,
	): string {
		let prompt = `Issue: ${identifier} - ${title}\n\n`;

		if (description) {
			prompt += `Description:\n${description}\n\n`;
		}

		prompt += `User comment:\n${commentBody}`;

		return prompt;
	}
}

/**
 * Create a new PromptBuilder instance
 */
export function createPromptBuilder(): PromptBuilder {
	return new PromptBuilder();
}
