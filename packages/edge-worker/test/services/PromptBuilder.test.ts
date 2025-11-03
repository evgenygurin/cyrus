import type { Issue as LinearIssue } from "@linear/sdk";
import type { RepositoryConfig } from "cyrus-core";
import { describe, expect, it } from "vitest";
import { PromptBuilder } from "../../src/services/PromptBuilder.js";

describe("PromptBuilder", () => {
	const mockIssue: Partial<LinearIssue> = {
		identifier: "TEST-123",
		title: "Test Issue",
		description: "This is a test issue description",
	};

	const mockRepository: RepositoryConfig = {
		id: "test-repo",
		name: "Test Repository",
		repositoryPath: "/test/path",
		baseBranch: "main",
		linearToken: "test-token",
		linearWorkspaceId: "test-workspace",
		linearWorkspaceName: "Test Workspace",
		workspaceBaseDir: "/test/workspace",
		labelPrompts: {
			bug: {
				labels: ["bug", "critical"],
				prompt: "You are a debugging expert. Help fix this bug.",
			},
			feature: {
				labels: ["feature", "enhancement"],
				prompt: "You are a feature implementation expert.",
			},
			simpleLabels: ["documentation", "test"],
		},
	};

	describe("determineSystemPromptFromLabels", () => {
		it("should return system prompt when labels match", () => {
			const builder = new PromptBuilder();
			const result = builder.determineSystemPromptFromLabels(
				["bug", "backend"],
				mockRepository,
			);

			expect(result).not.toBeNull();
			expect(result?.systemPrompt).toBe(
				"You are a debugging expert. Help fix this bug.",
			);
			expect(result?.matchedLabels).toEqual(["bug"]);
		});

		it("should return null when no labels match", () => {
			const builder = new PromptBuilder();
			const result = builder.determineSystemPromptFromLabels(
				["unrelated", "other"],
				mockRepository,
			);

			expect(result).toBeNull();
		});

		it("should return null when repository has no label prompts", () => {
			const builder = new PromptBuilder();
			const repoWithoutLabels: RepositoryConfig = {
				...mockRepository,
				labelPrompts: undefined,
			};

			const result = builder.determineSystemPromptFromLabels(
				["bug"],
				repoWithoutLabels,
			);

			expect(result).toBeNull();
		});

		it("should match multiple labels", () => {
			const builder = new PromptBuilder();
			const result = builder.determineSystemPromptFromLabels(
				["bug", "critical", "backend"],
				mockRepository,
			);

			expect(result).not.toBeNull();
			expect(result?.matchedLabels).toEqual(["bug", "critical"]);
		});

		it("should handle array format label configuration", () => {
			const builder = new PromptBuilder();
			const result = builder.determineSystemPromptFromLabels(
				["documentation"],
				mockRepository,
			);

			// Array format doesn't have a prompt, so should return null
			expect(result).toBeNull();
		});
	});

	describe("buildLabelBasedPrompt", () => {
		it("should build prompt with system prompt when labels match", () => {
			const builder = new PromptBuilder();
			const result = builder.buildLabelBasedPrompt(
				mockIssue as LinearIssue,
				["bug", "backend"],
				mockRepository,
			);

			expect(result.userPrompt).toContain("TEST-123");
			expect(result.userPrompt).toContain("Test Issue");
			expect(result.userPrompt).toContain("This is a test issue description");
			expect(result.userPrompt).toContain("Labels: bug");
			expect(result.systemPrompt).toBe(
				"You are a debugging expert. Help fix this bug.",
			);
		});

		it("should build prompt without system prompt when no labels match", () => {
			const builder = new PromptBuilder();
			const result = builder.buildLabelBasedPrompt(
				mockIssue as LinearIssue,
				["unrelated"],
				mockRepository,
			);

			expect(result.userPrompt).toContain("TEST-123");
			expect(result.userPrompt).toContain("Test Issue");
			expect(result.systemPrompt).toBeUndefined();
		});

		it("should handle issue without description", () => {
			const builder = new PromptBuilder();
			const issueWithoutDescription = {
				...mockIssue,
				description: null,
			};

			const result = builder.buildLabelBasedPrompt(
				issueWithoutDescription as LinearIssue,
				["bug"],
				mockRepository,
			);

			expect(result.userPrompt).toContain("TEST-123");
			expect(result.userPrompt).not.toContain("Description:");
		});
	});

	describe("buildMentionPrompt", () => {
		it("should build mention prompt with comment body", () => {
			const builder = new PromptBuilder();
			const commentBody = "@bot please help with this issue";

			const result = builder.buildMentionPrompt(
				mockIssue as LinearIssue,
				commentBody,
			);

			expect(result.userPrompt).toContain("TEST-123");
			expect(result.userPrompt).toContain("Test Issue");
			expect(result.userPrompt).toContain("This is a test issue description");
			expect(result.userPrompt).toContain(commentBody);
		});

		it("should handle issue without description", () => {
			const builder = new PromptBuilder();
			const issueWithoutDescription = {
				...mockIssue,
				description: null,
			};
			const commentBody = "@bot help";

			const result = builder.buildMentionPrompt(
				issueWithoutDescription as LinearIssue,
				commentBody,
			);

			expect(result.userPrompt).toContain("TEST-123");
			expect(result.userPrompt).toContain(commentBody);
			expect(result.userPrompt).not.toContain("Description:");
		});
	});
});
