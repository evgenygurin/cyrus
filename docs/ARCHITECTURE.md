# Cyrus Architecture

This document describes the modernized architecture of Cyrus, following clean architecture and domain-driven design principles.

## Table of Contents

- [Overview](#overview)
- [Architecture Layers](#architecture-layers)
- [Key Concepts](#key-concepts)
- [Error Handling](#error-handling)
- [Validation](#validation)
- [Dependency Injection](#dependency-injection)
- [Performance Monitoring](#performance-monitoring)
- [Event-Driven Architecture](#event-driven-architecture)

## Overview

Cyrus follows a clean, layered architecture that separates concerns and makes the codebase maintainable, testable, and scalable.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│                  (CLI, API, Webhooks)                   │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                   Application Layer                      │
│              (Use Cases, Orchestration)                  │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                     Domain Layer                         │
│          (Entities, Value Objects, Events)               │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                 Infrastructure Layer                     │
│        (Linear API, Claude API, Git, Database)           │
└─────────────────────────────────────────────────────────┘
```

## Architecture Layers

### 1. Domain Layer (`packages/core/src/domain/`)

The core business logic and rules. This layer is independent of external frameworks and technologies.

**Components:**
- **Entities**: Core business objects with identity (e.g., Issue, Session, Repository)
- **Value Objects**: Immutable objects defined by their attributes (e.g., LinearToken, RepositoryPath)
- **Domain Events**: Events that represent something that happened in the domain
- **Domain Services**: Stateless services that contain domain logic not naturally fitting in entities

**Example:**
```typescript
import { LinearToken } from 'cyrus-core';

// Value Object with validation
const token = LinearToken.create('lin_oauth_...');
if (token.isFailure) {
  console.error(token.error);
}
```

### 2. Application Layer (`packages/core/src/services/`)

Orchestrates the domain layer to fulfill use cases.

**Components:**
- **Use Cases**: Application-specific business rules
- **Application Services**: Coordinate between domain objects
- **DTOs**: Data Transfer Objects for communication between layers

**Example:**
```typescript
import { ConfigurationService } from 'cyrus-core';

const configService = new ConfigurationService();
const config = await configService.loadConfiguration(configPath);
```

### 3. Infrastructure Layer

Implementations of external services and persistence.

**Components:**
- **Linear Client**: Interacts with Linear API
- **Claude Client**: Interacts with Claude API
- **Git Service**: Manages git operations
- **Persistence**: File-based or database persistence

### 4. Presentation Layer

User interfaces and external communication.

**Components:**
- **CLI**: Command-line interface (`apps/cli/`)
- **Webhooks**: Linear webhook handlers
- **OAuth**: Authentication flows

## Key Concepts

### Result Pattern

Cyrus uses the Result pattern for explicit error handling instead of throwing exceptions.

```typescript
import { Result } from 'cyrus-core';

function divide(a: number, b: number): Result<number> {
  if (b === 0) {
    return Result.fail('Cannot divide by zero');
  }
  return Result.ok(a / b);
}

const result = divide(10, 2);
if (result.isSuccess) {
  console.log('Result:', result.value);
} else {
  console.error('Error:', result.error);
}
```

### Value Objects

Immutable objects that are defined by their attributes rather than identity.

```typescript
import { LinearToken } from 'cyrus-core';

const token = LinearToken.create('lin_oauth_token');
// Automatically validates format
// Provides type safety
```

## Error Handling

Cyrus provides a comprehensive error hierarchy for better error handling and recovery.

### Error Types

1. **BaseError**: Abstract base class for all errors
2. **DomainError**: Business logic violations
   - `InvalidConfigurationError`
   - `InvalidStateError`
   - `ValidationError`
3. **InfrastructureError**: External service failures
   - `LinearAPIError`
   - `ClaudeAPIError`
   - `GitOperationError`
   - `NetworkError`
   - `TimeoutError`

### Using Errors

```typescript
import { LinearAPIError, ErrorHandler } from 'cyrus-core';

// Throw typed errors
throw new LinearAPIError('Failed to fetch issue', 404, { issueId: '123' });

// Automatic retry with exponential backoff
const result = await ErrorHandler.withRetry(
  async () => linearClient.getIssue(issueId),
  {
    maxAttempts: 3,
    initialDelayMs: 1000,
    backoffMultiplier: 2,
  }
);

// With timeout
const result = await ErrorHandler.withTimeout(
  async () => longRunningOperation(),
  30000, // 30 seconds
  'Operation timed out'
);
```

## Validation

Configuration and data validation using Zod schemas.

### Schema Validation

```typescript
import { ConfigValidator, EdgeConfig } from 'cyrus-core';

try {
  const config = ConfigValidator.validateEdgeConfig(rawConfig);
  // config is fully typed and validated
} catch (error) {
  if (error instanceof ValidationError) {
    error.validationErrors.forEach(err => {
      console.error(`${err.field}: ${err.message}`);
    });
  }
}

// Safe parsing (returns undefined on failure)
const config = ConfigValidator.safeParseEdgeConfig(rawConfig);
if (config) {
  // Use validated config
}
```

### Custom Schemas

```typescript
import { z } from 'zod';

const MySchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
  email: z.string().email(),
});

type MyType = z.infer<typeof MySchema>;
```

## Dependency Injection

Cyrus uses InversifyJS for dependency injection, enabling loose coupling and testability.

### Container Setup

```typescript
import { Container, TYPES } from 'cyrus-core';

const container = Container.getInstance();

// Bind services
container.bind(TYPES.LinearClient).to(LinearClient);
container.bind(TYPES.ConfigurationService).to(ConfigurationService);

// Resolve dependencies
const configService = container.get<ConfigurationService>(
  TYPES.ConfigurationService
);
```

### Injectable Classes

```typescript
import { injectable, inject } from 'inversify';
import { TYPES } from 'cyrus-core';

@injectable()
class IssueProcessor {
  constructor(
    @inject(TYPES.LinearClient) private linearClient: ILinearClient,
    @inject(TYPES.Logger) private logger: ILogger
  ) {}

  async processIssue(issueId: string): Promise<void> {
    this.logger.info('Processing issue', { issueId });
    const issue = await this.linearClient.getIssue(issueId);
    // ...
  }
}
```

## Performance Monitoring

Track operation performance and memory usage.

### Tracking Performance

```typescript
import { PerformanceMonitor } from 'cyrus-core';

const monitor = new PerformanceMonitor();

// Track an async operation
const result = await monitor.track('processIssue', async () => {
  return await processIssue(issueId);
});

// Get statistics
const stats = monitor.getStats('processIssue');
console.log(`Average duration: ${stats.avgDuration}ms`);
console.log(`P95 duration: ${stats.p95Duration}ms`);
console.log(`Success rate: ${stats.successCount / stats.count}`);
```

### Decorator Usage

```typescript
import { TrackPerformance } from 'cyrus-core';

class MyService {
  @TrackPerformance('MyService.expensiveOperation')
  async expensiveOperation(): Promise<void> {
    // Automatically tracked
  }
}
```

## Event-Driven Architecture

Cyrus uses domain events for decoupled communication between components.

### Publishing Events

```typescript
import { eventBus, IssueAssignedEvent } from 'cyrus-core';

// Publish event
const event = new IssueAssignedEvent(
  issueId,
  assigneeId,
  repositoryId
);
await eventBus.publish(event);
```

### Subscribing to Events

```typescript
import { eventBus } from 'cyrus-core';

// Subscribe to specific event type
eventBus.subscribe('IssueAssigned', async (event) => {
  console.log('Issue assigned:', event.issueId);
  await processIssue(event.issueId);
});

// Subscribe to multiple events
eventBus.subscribeToMany(
  ['SessionStarted', 'SessionCompleted'],
  async (event) => {
    await updateMetrics(event);
  }
);
```

### Available Events

- **Issue Events**: `IssueAssignedEvent`, `IssueUnassignedEvent`, `IssueCommentAddedEvent`
- **Session Events**: `SessionStartedEvent`, `SessionCompletedEvent`, `SessionFailedEvent`
- **Workspace Events**: `WorkspaceCreatedEvent`
- **Configuration Events**: `ConfigurationLoadedEvent`, `ConfigurationReloadedEvent`

### Custom Events

```typescript
import { BaseDomainEvent } from 'cyrus-core';

class PullRequestCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly prId: string,
    public readonly issueId: string,
    public readonly url: string,
    metadata?: Record<string, unknown>
  ) {
    super('PullRequestCreated', prId, { ...metadata, issueId, url });
  }
}
```

## Best Practices

1. **Use Result Pattern**: Return `Result<T>` instead of throwing exceptions for expected errors
2. **Validate Early**: Use Zod schemas at system boundaries
3. **Type Safety**: Leverage TypeScript's type system fully
4. **Dependency Injection**: Use DI for testability and loose coupling
5. **Event-Driven**: Use events for cross-cutting concerns
6. **Performance Monitoring**: Track critical operations
7. **Error Context**: Always provide context with errors
8. **Immutability**: Use value objects and immutable data structures

## Testing

### Unit Testing with DI

```typescript
import { Container, TYPES } from 'cyrus-core';

describe('IssueProcessor', () => {
  let container: Container;
  let mockLinearClient: MockLinearClient;

  beforeEach(() => {
    container = Container.createChild();
    mockLinearClient = new MockLinearClient();
    container.rebind(TYPES.LinearClient).toConstantValue(mockLinearClient);
  });

  it('should process issue', async () => {
    const processor = container.get<IssueProcessor>(TYPES.IssueProcessor);
    await processor.processIssue('TEST-123');
    expect(mockLinearClient.getIssue).toHaveBeenCalledWith('TEST-123');
  });
});
```

## Migration Guide

For migrating existing code to the new architecture, see [MIGRATION.md](./MIGRATION.md).

## Further Reading

- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [InversifyJS Documentation](https://inversify.io/)
- [Zod Documentation](https://zod.dev/)
