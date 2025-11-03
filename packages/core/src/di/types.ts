/**
 * Dependency injection type identifiers
 * Used with InversifyJS for type-safe dependency injection
 */
export const TYPES = {
	// Configuration
	ConfigurationService: Symbol.for("ConfigurationService"),
	ConfigValidator: Symbol.for("ConfigValidator"),

	// Domain Services
	SessionManager: Symbol.for("SessionManager"),
	PersistenceManager: Symbol.for("PersistenceManager"),

	// Infrastructure Services
	LinearClient: Symbol.for("LinearClient"),
	ClaudeClient: Symbol.for("ClaudeClient"),
	GitService: Symbol.for("GitService"),

	// Utilities
	Logger: Symbol.for("Logger"),
	ErrorHandler: Symbol.for("ErrorHandler"),
	PerformanceMonitor: Symbol.for("PerformanceMonitor"),
	EventBus: Symbol.for("EventBus"),

	// Application Services
	IssueProcessor: Symbol.for("IssueProcessor"),
	WorkspaceManager: Symbol.for("WorkspaceManager"),
	WebhookHandler: Symbol.for("WebhookHandler"),
} as const;

/**
 * Type-safe interface identifiers
 */
export const INTERFACES = {
	IConfigurationService: Symbol.for("IConfigurationService"),
	ILinearClient: Symbol.for("ILinearClient"),
	IClaudeClient: Symbol.for("IClaudeClient"),
	IGitService: Symbol.for("IGitService"),
	ILogger: Symbol.for("ILogger"),
	IEventBus: Symbol.for("IEventBus"),
} as const;
