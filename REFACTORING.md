# Refactoring Documentation

This document describes the modern refactoring patterns applied to the Cyrus codebase.

## Overview

The refactoring focuses on applying SOLID principles, Clean Architecture patterns, and modern TypeScript best practices to improve code maintainability, testability, and scalability.

## Modern Programming Principles Applied

### 1. Single Responsibility Principle (SRP)

**Problem**: Large classes like `EdgeApp` (2000+ lines) and `ClaudeRunner` (880 lines) had multiple responsibilities.

**Solution**: Extracted specialized services:

- **ConfigurationService** (`packages/core/src/services/ConfigurationService.ts`)
  - Handles all configuration file operations
  - Manages migration from legacy locations
  - Single responsibility: Configuration persistence

- **SubscriptionService** (`packages/core/src/services/SubscriptionService.ts`)
  - Validates subscription status
  - Manages billing portal access
  - Single responsibility: Subscription management

- **LoggingService** (`packages/claude-runner/src/services/LoggingService.ts`)
  - Manages session logging
  - Handles both detailed JSON and human-readable logs
  - Single responsibility: Logging operations

### 2. Domain-Driven Design (DDD)

**Value Objects** for type safety and validation at domain level:

- **CustomerId** (`packages/core/src/domain/value-objects/CustomerId.ts`)
  - Validates customer ID format at construction
  - Prevents invalid customer IDs from entering the system
  - Immutable value object

- **LinearToken** (`packages/core/src/domain/value-objects/LinearToken.ts`)
  - Validates Linear OAuth token format
  - Provides masked token display for logging
  - Immutable value object

- **RepositoryPath** (`packages/core/src/domain/value-objects/RepositoryPath.ts`)
  - Normalizes and validates repository paths
  - Ensures absolute paths
  - Immutable value object

### 3. Functional Error Handling

**Result Type** (`packages/core/src/domain/Result.ts`)

Replaces try-catch with explicit success/failure handling:

```typescript
// Before (imperative)
try {
  const config = loadConfig();
  const result = processConfig(config);
  return result;
} catch (error) {
  console.error(error);
  return null;
}

// After (functional)
const configResult = configService.load();
if (configResult.isFailure) {
  return configResult.mapError(e => new ProcessingError(e));
}

return configResult
  .flatMap(config => processConfig(config))
  .map(result => formatResult(result));
```

Benefits:
- Explicit error handling in type system
- Composable operations (map, flatMap)
- No hidden exceptions
- Better testability

### 4. Dependency Injection

Services are designed to accept dependencies through constructors:

```typescript
// Before
class EdgeApp {
  constructor(cyrusHome: string) {
    // Tight coupling to file system, HTTP clients, etc.
  }
}

// After
class EdgeApp {
  constructor(
    private configService: ConfigurationService,
    private subscriptionService: SubscriptionService,
    private oauthService: OAuthService
  ) {
    // Dependencies injected, easy to mock for testing
  }
}
```

### 5. Interface Segregation

Services implement focused interfaces:

```typescript
interface IConfigurationService {
  load(): Result<EdgeConfig, Error>;
  save(config: EdgeConfig): Result<void, Error>;
  exists(): boolean;
}

interface ISubscriptionService {
  checkStatus(customerId: CustomerId): Promise<Result<SubscriptionStatus, Error>>;
  validate(customerId: CustomerId): Promise<Result<SubscriptionStatus, SubscriptionError>>;
}
```

## Architecture Layers

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│    (CLI, Electron, API endpoints)   │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│       Application Layer             │
│  (EdgeWorker, AgentSessionManager)  │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│         Domain Layer                │
│  (Value Objects, Entities, Result)  │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│      Infrastructure Layer           │
│ (Services, Repositories, External)  │
└─────────────────────────────────────┘
```

## Benefits

### Maintainability
- Smaller, focused classes easier to understand
- Clear separation of concerns
- Single Responsibility Principle reduces coupling

### Testability
- Services can be easily mocked
- Value objects ensure valid state
- Result type makes error cases explicit

### Type Safety
- Value objects prevent invalid data at compile time
- Result type makes error handling explicit in signatures
- No null/undefined confusion

### Extensibility
- New features can be added without modifying existing code (Open/Closed Principle)
- Dependency injection allows easy swapping of implementations
- Interface segregation prevents breaking changes

## Migration Guide

### Using ConfigurationService

```typescript
// Before
const config = JSON.parse(readFileSync(configPath, 'utf-8'));

// After
const configService = new ConfigurationService(cyrusHome);
const configResult = configService.load();
if (configResult.isSuccess) {
  const config = configResult.value;
}
```

### Using Value Objects

```typescript
// Before
const customerId = "cus_123"; // Could be invalid
if (!customerId.startsWith("cus_")) {
  throw new Error("Invalid customer ID");
}

// After
const customerIdResult = Result.from(() => CustomerId.create("cus_123"));
if (customerIdResult.isSuccess) {
  const customerId = customerIdResult.value;
  // Guaranteed to be valid
}
```

### Using Result Type

```typescript
// Before
async function fetchData() {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

// After
async function fetchData(): Promise<Result<Data, Error>> {
  return Result.fromAsync(async () => {
    const response = await fetch(url);
    return await response.json();
  });
}
```

## Next Steps

The following refactorings are recommended for future iterations:

1. **Extract OAuth Service** from EdgeApp
2. **Create Repository Pattern** for Linear API interactions
3. **Apply Command Pattern** for CLI commands
4. **Extract Worktree Manager** from EdgeApp
5. **Create Factory Pattern** for ClaudeRunner instantiation
6. **Implement Event Sourcing** for session state management
7. **Add Unit Tests** for all new services and value objects

## Testing Strategy

### Value Objects
```typescript
describe('CustomerId', () => {
  it('should create valid customer ID', () => {
    const result = Result.from(() => CustomerId.create('cus_123'));
    expect(result.isSuccess).toBe(true);
  });

  it('should reject invalid customer ID', () => {
    const result = Result.from(() => CustomerId.create('invalid'));
    expect(result.isFailure).toBe(true);
  });
});
```

### Services
```typescript
describe('ConfigurationService', () => {
  it('should load configuration', () => {
    const service = new ConfigurationService('/tmp/test');
    const result = service.load();
    expect(result.isSuccess).toBe(true);
  });
});
```

## Conclusion

This refactoring establishes a solid foundation for future development by:

- Applying proven software engineering principles
- Improving code organization and readability
- Making the codebase more testable and maintainable
- Reducing technical debt
- Enabling safer and faster feature development

The patterns introduced here should be followed for all new code and gradually applied to existing code as it's modified.
