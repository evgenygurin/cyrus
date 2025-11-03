import { z } from "zod";

/**
 * Zod schema for tool permissions
 */
export const ToolPermissionSchema = z.union([
	z.literal("readOnly"),
	z.literal("safe"),
	z.literal("all"),
	z.literal("coordinator"),
	z.array(z.string()),
]);

/**
 * Zod schema for label prompt configuration
 */
export const LabelPromptConfigSchema = z.object({
	labels: z.array(z.string()).min(1, "At least one label is required"),
	allowedTools: ToolPermissionSchema.optional(),
	disallowedTools: z.array(z.string()).optional(),
});

/**
 * Zod schema for label prompts
 */
export const LabelPromptsSchema = z
	.object({
		debugger: LabelPromptConfigSchema.optional(),
		builder: LabelPromptConfigSchema.optional(),
		scoper: LabelPromptConfigSchema.optional(),
		orchestrator: LabelPromptConfigSchema.optional(),
	})
	.optional();

/**
 * Zod schema for repository configuration
 */
export const RepositoryConfigSchema = z.object({
	// Repository identification
	id: z.string().min(1, "Repository ID is required"),
	name: z.string().min(1, "Repository name is required"),

	// Git configuration
	repositoryPath: z.string().min(1, "Repository path is required"),
	baseBranch: z.string().default("main"),

	// Linear configuration
	linearWorkspaceId: z.string().min(1, "Linear workspace ID is required"),
	linearWorkspaceName: z.string().optional(),
	linearToken: z.string().min(1, "Linear token is required"),
	teamKeys: z.array(z.string()).optional(),
	routingLabels: z.array(z.string()).optional(),
	projectKeys: z.array(z.string()).optional(),

	// Workspace configuration
	workspaceBaseDir: z.string().min(1, "Workspace base directory is required"),

	// Optional settings
	isActive: z.boolean().default(true),
	promptTemplatePath: z.string().optional(),
	allowedTools: z.array(z.string()).optional(),
	disallowedTools: z.array(z.string()).optional(),
	mcpConfigPath: z.union([z.string(), z.array(z.string())]).optional(),
	appendInstruction: z.string().optional(),
	model: z.string().optional(),
	fallbackModel: z.string().optional(),

	// OpenAI configuration
	openaiApiKey: z.string().optional(),
	openaiOutputDirectory: z.string().optional(),

	// Label-based prompts
	labelPrompts: LabelPromptsSchema,
});

/**
 * Zod schema for prompt defaults
 */
export const PromptDefaultsSchema = z
	.object({
		debugger: z
			.object({
				allowedTools: ToolPermissionSchema.optional(),
				disallowedTools: z.array(z.string()).optional(),
			})
			.optional(),
		builder: z
			.object({
				allowedTools: ToolPermissionSchema.optional(),
				disallowedTools: z.array(z.string()).optional(),
			})
			.optional(),
		scoper: z
			.object({
				allowedTools: ToolPermissionSchema.optional(),
				disallowedTools: z.array(z.string()).optional(),
			})
			.optional(),
		orchestrator: z
			.object({
				allowedTools: ToolPermissionSchema.optional(),
				disallowedTools: z.array(z.string()).optional(),
			})
			.optional(),
	})
	.optional();

/**
 * Zod schema for EdgeWorker configuration
 */
export const EdgeWorkerConfigSchema = z.object({
	// Proxy connection
	proxyUrl: z.string().url("Invalid proxy URL"),
	baseUrl: z.string().url("Invalid base URL").optional(),
	webhookBaseUrl: z.string().url("Invalid webhook base URL").optional(),
	webhookPort: z.number().int().positive().optional(),
	serverPort: z.number().int().positive().default(3456),
	serverHost: z.string().default("localhost"),
	ngrokAuthToken: z.string().optional(),

	// Claude configuration
	defaultAllowedTools: z.array(z.string()).optional(),
	defaultDisallowedTools: z.array(z.string()).optional(),
	defaultModel: z.string().optional(),
	defaultFallbackModel: z.string().optional(),

	// Prompt defaults
	promptDefaults: PromptDefaultsSchema,

	// Repositories
	repositories: z
		.array(RepositoryConfigSchema)
		.min(1, "At least one repository is required"),

	// Cyrus home
	cyrusHome: z.string().min(1, "Cyrus home directory is required"),

	// Features
	features: z
		.object({
			enableContinuation: z.boolean().default(true),
			enableTokenLimitHandling: z.boolean().default(true),
			enableAttachmentDownload: z.boolean().default(false),
			promptTemplatePath: z.string().optional(),
		})
		.optional(),
});

/**
 * Zod schema for Edge configuration (stored in config.json)
 */
export const EdgeConfigSchema = z.object({
	repositories: z.array(RepositoryConfigSchema),
	ngrokAuthToken: z.string().optional(),
	stripeCustomerId: z.string().optional(),
	defaultModel: z.string().optional(),
	defaultFallbackModel: z.string().optional(),
	global_setup_script: z.string().optional(),
});

/**
 * Type exports inferred from schemas
 */
export type RepositoryConfig = z.infer<typeof RepositoryConfigSchema>;
export type EdgeWorkerConfig = z.infer<typeof EdgeWorkerConfigSchema>;
export type EdgeConfig = z.infer<typeof EdgeConfigSchema>;
export type LabelPrompts = z.infer<typeof LabelPromptsSchema>;
export type PromptDefaults = z.infer<typeof PromptDefaultsSchema>;
