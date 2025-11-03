/**
 * Base interface for all domain events
 */
export interface DomainEvent {
	readonly eventType: string;
	readonly eventId: string;
	readonly occurredAt: Date;
	readonly aggregateId: string;
	readonly metadata?: Record<string, unknown>;
}

/**
 * Base class for domain events
 */
export abstract class BaseDomainEvent implements DomainEvent {
	public readonly eventId: string;
	public readonly occurredAt: Date;

	constructor(
		public readonly eventType: string,
		public readonly aggregateId: string,
		public readonly metadata?: Record<string, unknown>,
	) {
		this.eventId = this.generateEventId();
		this.occurredAt = new Date();
	}

	private generateEventId(): string {
		return `${this.eventType}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
	}

	toJSON(): Record<string, unknown> {
		return {
			eventType: this.eventType,
			eventId: this.eventId,
			occurredAt: this.occurredAt.toISOString(),
			aggregateId: this.aggregateId,
			metadata: this.metadata,
		};
	}
}

/**
 * Issue-related events
 */
export class IssueAssignedEvent extends BaseDomainEvent {
	constructor(
		public readonly issueId: string,
		public readonly assigneeId: string,
		public readonly repositoryId: string,
		metadata?: Record<string, unknown>,
	) {
		super("IssueAssigned", issueId, {
			...metadata,
			assigneeId,
			repositoryId,
		});
	}
}

export class IssueUnassignedEvent extends BaseDomainEvent {
	constructor(
		public readonly issueId: string,
		public readonly previousAssigneeId: string,
		metadata?: Record<string, unknown>,
	) {
		super("IssueUnassigned", issueId, {
			...metadata,
			previousAssigneeId,
		});
	}
}

export class IssueCommentAddedEvent extends BaseDomainEvent {
	constructor(
		public readonly issueId: string,
		public readonly commentId: string,
		public readonly commentAuthor: string,
		public readonly commentBody: string,
		metadata?: Record<string, unknown>,
	) {
		super("IssueCommentAdded", issueId, {
			...metadata,
			commentId,
			commentAuthor,
		});
	}
}

/**
 * Session-related events
 */
export class SessionStartedEvent extends BaseDomainEvent {
	constructor(
		public readonly sessionId: string,
		public readonly issueId: string,
		public readonly repositoryId: string,
		public readonly workspacePath: string,
		metadata?: Record<string, unknown>,
	) {
		super("SessionStarted", sessionId, {
			...metadata,
			issueId,
			repositoryId,
			workspacePath,
		});
	}
}

export class SessionCompletedEvent extends BaseDomainEvent {
	constructor(
		public readonly sessionId: string,
		public readonly issueId: string,
		public readonly exitCode: number | null,
		public readonly duration: number,
		metadata?: Record<string, unknown>,
	) {
		super("SessionCompleted", sessionId, {
			...metadata,
			issueId,
			exitCode,
			duration,
		});
	}
}

export class SessionFailedEvent extends BaseDomainEvent {
	constructor(
		public readonly sessionId: string,
		public readonly issueId: string,
		public readonly error: Error,
		metadata?: Record<string, unknown>,
	) {
		super("SessionFailed", sessionId, {
			...metadata,
			issueId,
			errorMessage: error.message,
			errorStack: error.stack,
		});
	}
}

/**
 * Workspace-related events
 */
export class WorkspaceCreatedEvent extends BaseDomainEvent {
	constructor(
		public readonly workspaceId: string,
		public readonly issueId: string,
		public readonly path: string,
		public readonly isGitWorktree: boolean,
		metadata?: Record<string, unknown>,
	) {
		super("WorkspaceCreated", workspaceId, {
			...metadata,
			issueId,
			path,
			isGitWorktree,
		});
	}
}

/**
 * Configuration-related events
 */
export class ConfigurationLoadedEvent extends BaseDomainEvent {
	constructor(
		public readonly configPath: string,
		public readonly repositoryCount: number,
		metadata?: Record<string, unknown>,
	) {
		super("ConfigurationLoaded", configPath, {
			...metadata,
			repositoryCount,
		});
	}
}

export class ConfigurationReloadedEvent extends BaseDomainEvent {
	constructor(
		public readonly configPath: string,
		metadata?: Record<string, unknown>,
	) {
		super("ConfigurationReloaded", configPath, metadata);
	}
}
