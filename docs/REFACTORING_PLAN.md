# Comprehensive Refactoring Plan

## Analysis Summary

### Research Findings: Modern Refactoring Best Practices (2025)

Based on research from Martin Fowler's refactoring catalog, Clean Code TypeScript guidelines, and modern monorepo patterns, the following principles should guide our refactoring:

**Core Principles:**
1. **Extract Method/Function** - Break down large functions into smaller, focused ones
2. **Reduce Coupling** - Use dependency injection, not direct instantiation
3. **Single Responsibility** - Each class should have one reason to change
4. **Type Safety** - Avoid `any`, use explicit types and runtime validation
5. **Test Before Refactoring** - Ensure comprehensive test coverage
6. **Small, Incremental Steps** - Refactor gradually, preserving behavior
7. **Functional Approaches** - Use modern JavaScript/TypeScript patterns
8. **Command Pattern** - For CLI commands and operations
9. **Repository Pattern** - Abstract external API interactions
10. **Strategy Pattern** - For varying algorithms and behaviors

### Code Smell Analysis

**Large Files Identified:**
1. `EdgeWorker.ts` - **5,055 lines** ⚠️ Critical
2. `app.ts` (CLI) - **2,027 lines** ⚠️ Critical
3. `AgentSessionManager.ts` - **1,510 lines** ⚠️ High Priority
4. `SharedApplicationServer.ts` - **1,132 lines** ⚠️ High Priority
5. `ClaudeRunner.ts` - **879 lines** ⚠️ Medium Priority

### Specific Issues Found

#### EdgeWorker.ts (5,055 lines)
**Multiple Responsibilities Detected:**
- Webhook handling (15+ webhook-related methods)
- Configuration management (5+ config-related methods)
- Repository lifecycle management (3+ repo methods)
- Linear client management
- Session orchestration
- Prompt assembly (3+ prompt-building methods)
- Token management
- File watching

**Methods Count:** 40+ methods in single class

**Suggested Extractions:**
1. WebhookHandler service
2. ConfigurationManager service
3. RepositoryManager service
4. LinearClientFactory service
5. PromptBuilder service
6. TokenManager service

#### app.ts (2,027 lines)
**Multiple Responsibilities Detected:**
- CLI argument parsing
- Command implementations (6+ commands)
- OAuth flow handling
- HTTP server management
- Configuration file I/O
- Token management
- User interaction (readline)

**Suggested Extractions:**
1. Command pattern for each CLI command
2. OAuthService (already suggested in previous refactoring)
3. ConfigurationService (already exists, needs adoption)
4. CLIServer service
5. UserInteractionService

#### AgentSessionManager.ts (1,510 lines)
**Multiple Responsibilities Detected:**
- Session lifecycle management
- Entry tracking and storage
- Linear activity posting (5+ activity types)
- Tool call handling
- Status updates
- Message formatting

**Suggested Extractions:**
1. SessionRepository for persistence
2. LinearActivityService for posting activities
3. ToolCallHandler service
4. SessionFormatter service

## Refactoring Strategy

### Phase 1: Foundation Services (Week 1)

**Priority: Critical**

#### 1.1 Extract WebhookHandler Service
- **Location:** `packages/edge-worker/src/services/WebhookHandler.ts`
- **Responsibility:** Handle all webhook types using Strategy pattern
- **Methods to move:**
  - `handleWebhook()`
  - `handleAgentSessionCreatedWebhook()`
  - `handleUserPostedAgentActivity()`
  - `handleIssueUnassignedWebhook()`
- **Benefits:** Reduces EdgeWorker by ~800 lines, enables testing each webhook type independently

#### 1.2 Extract PromptBuilder Service
- **Location:** `packages/edge-worker/src/services/PromptBuilder.ts`
- **Responsibility:** Assemble prompts based on context
- **Methods to move:**
  - `buildLabelBasedPrompt()`
  - `buildMentionPrompt()`
  - `determineSystemPromptFromLabels()`
- **Benefits:** Reduces EdgeWorker by ~300 lines, centralizes prompt logic

#### 1.3 Extract ConfigurationManager Service
- **Location:** `packages/edge-worker/src/services/ConfigurationManager.ts`
- **Responsibility:** Manage configuration lifecycle and hot-reloading
- **Methods to move:**
  - `loadConfigSafely()`
  - `handleConfigChange()`
  - `detectRepositoryChanges()`
  - `startConfigWatcher()`
- **Benefits:** Reduces EdgeWorker by ~200 lines, makes config handling testable

#### 1.4 Extract RepositoryManager Service
- **Location:** `packages/edge-worker/src/services/RepositoryManager.ts`
- **Responsibility:** Manage repository lifecycle
- **Methods to move:**
  - `addNewRepositories()`
  - `updateModifiedRepositories()`
  - `removeDeletedRepositories()`
  - `findRepositoryForWebhook()`
- **Benefits:** Reduces EdgeWorker by ~400 lines, clear ownership of repo operations

### Phase 2: CLI Commands Refactoring (Week 2)

**Priority: High**

#### 2.1 Apply Command Pattern to CLI
- **Location:** `apps/cli/commands/`
- **Create Commands:**
  - `CheckTokensCommand.ts`
  - `RefreshTokenCommand.ts`
  - `AddRepositoryCommand.ts`
  - `SetCustomerIdCommand.ts`
  - `BillingCommand.ts`
  - `StartCommand.ts`
- **Benefits:** Reduces app.ts by ~1,500 lines, testable commands, extensible architecture

#### 2.2 Extract OAuthService
- **Location:** `apps/cli/services/OAuthService.ts`
- **Responsibility:** Handle OAuth flows
- **Methods to extract:** OAuth callback handling, token exchange
- **Benefits:** Reusable OAuth logic, easier to test

#### 2.3 Extract CLIServer Service
- **Location:** `apps/cli/services/CLIServer.ts`
- **Responsibility:** HTTP server for OAuth callbacks
- **Benefits:** Separation of concerns, testable server logic

### Phase 3: Session Management Refactoring (Week 3)

**Priority: High**

#### 3.1 Extract LinearActivityService
- **Location:** `packages/edge-worker/src/services/LinearActivityService.ts`
- **Responsibility:** Post activities to Linear
- **Methods to move:**
  - `createThoughtActivity()`
  - `createActionActivity()`
  - `createResponseActivity()`
  - `createErrorActivity()`
  - `createElicitationActivity()`
  - `createApprovalElicitation()`
- **Benefits:** Reduces AgentSessionManager by ~400 lines, clear API contract

#### 3.2 Create SessionRepository
- **Location:** `packages/edge-worker/src/repositories/SessionRepository.ts`
- **Responsibility:** Session persistence and retrieval
- **Pattern:** Repository pattern for data access
- **Benefits:** Abstracted persistence, easier to swap storage backends

#### 3.3 Extract ToolCallHandler
- **Location:** `packages/edge-worker/src/services/ToolCallHandler.ts`
- **Responsibility:** Handle tool calls and results
- **Methods to move:**
  - `extractToolInfo()`
  - `extractToolResult()`
  - Tool call tracking logic
- **Benefits:** Focused responsibility, testable tool handling

### Phase 4: Apply DI and Modern Patterns (Week 4)

**Priority: Medium**

#### 4.1 Implement Dependency Injection
- **Action:** Wire up InversifyJS container across services
- **Update:** All new services to use @injectable decorator
- **Benefits:** Testability, loose coupling, easier mocking

#### 4.2 Add Error Handling
- **Action:** Replace try-catch with ErrorHandler from cyrus-core
- **Add:** Automatic retry logic for external API calls
- **Benefits:** Resilient operations, better error reporting

#### 4.3 Add Performance Monitoring
- **Action:** Add @TrackPerformance decorators to critical paths
- **Track:** Webhook processing, session creation, prompt assembly
- **Benefits:** Visibility into performance bottlenecks

#### 4.4 Implement Event-Driven Communication
- **Action:** Use EventBus for cross-service communication
- **Publish:** SessionStarted, SessionCompleted, WebhookReceived events
- **Benefits:** Decoupled architecture, extensible workflows

### Phase 5: Testing and Documentation (Week 5)

**Priority: High**

#### 5.1 Add Unit Tests
- **Target:** All extracted services
- **Coverage Goal:** 80%+ for new services
- **Tools:** Vitest with mocks

#### 5.2 Add Integration Tests
- **Target:** End-to-end workflows
- **Scenarios:** Webhook → Session → Activity posting
- **Tools:** Vitest with test fixtures

#### 5.3 Update Documentation
- **Files:**
  - `docs/ARCHITECTURE.md` - Update with new services
  - `docs/SERVICES.md` - Document each service
  - `CHANGELOG.md` - Record refactoring changes
- **Examples:** Add usage examples for each service

## Expected Outcomes

### Metrics

**Before Refactoring:**
- EdgeWorker: 5,055 lines
- app.ts: 2,027 lines
- AgentSessionManager: 1,510 lines
- **Total:** 8,592 lines in 3 files

**After Refactoring (Projected):**
- EdgeWorker: ~2,000 lines (-60%)
- app.ts: ~300 lines (-85%)
- AgentSessionManager: ~600 lines (-60%)
- New services: ~3,000 lines (well-organized, testable)
- **Total:** ~5,900 lines (31% reduction + better organization)

### Benefits

1. **Maintainability:** Smaller, focused classes easier to understand and modify
2. **Testability:** Services can be tested in isolation with mocks
3. **Extensibility:** New features can be added without modifying core classes
4. **Reliability:** Error handling and retry logic reduce failures
5. **Performance:** Monitoring identifies bottlenecks
6. **Onboarding:** New developers can understand one service at a time
7. **Type Safety:** Runtime validation catches configuration errors
8. **Decoupling:** Services communicate via events and DI

## Migration Strategy

### Backward Compatibility

All refactoring will maintain backward compatibility:
- Existing APIs remain unchanged
- New services are opt-in initially
- Gradual migration of internal code

### Risk Mitigation

1. **Test Coverage:** Ensure tests pass before and after each change
2. **Incremental Changes:** One service extraction at a time
3. **Code Review:** Peer review of each phase
4. **Rollback Plan:** Git branches for each phase
5. **Monitoring:** Track errors and performance after deployment

## Implementation Checklist

### Phase 1 (Week 1)
- [ ] Extract WebhookHandler service
- [ ] Extract PromptBuilder service
- [ ] Extract ConfigurationManager service
- [ ] Extract RepositoryManager service
- [ ] Add unit tests for each service
- [ ] Update EdgeWorker to use new services

### Phase 2 (Week 2)
- [ ] Create Command base class and interface
- [ ] Implement each CLI command
- [ ] Extract OAuthService
- [ ] Extract CLIServer
- [ ] Add CommandRegistry
- [ ] Update app.ts to use commands
- [ ] Add unit tests for commands

### Phase 3 (Week 3)
- [ ] Extract LinearActivityService
- [ ] Create SessionRepository
- [ ] Extract ToolCallHandler
- [ ] Update AgentSessionManager to use new services
- [ ] Add unit tests for each service

### Phase 4 (Week 4)
- [ ] Set up DI container bindings
- [ ] Add @injectable decorators
- [ ] Replace try-catch with ErrorHandler
- [ ] Add @TrackPerformance decorators
- [ ] Implement event publishing
- [ ] Add event subscribers

### Phase 5 (Week 5)
- [ ] Write unit tests (target 80% coverage)
- [ ] Write integration tests
- [ ] Update ARCHITECTURE.md
- [ ] Create SERVICES.md
- [ ] Update CHANGELOG.md
- [ ] Create migration guide

## Next Steps

1. **Review and Approve Plan:** Team review of this refactoring plan
2. **Set Up Branch:** Create refactoring branch from main
3. **Begin Phase 1:** Start with WebhookHandler extraction
4. **Daily Commits:** Commit after each service extraction
5. **Continuous Testing:** Run tests after each change

## References

- [Martin Fowler - Refactoring Catalog](https://refactoring.com/catalog/)
- [Clean Code TypeScript](https://github.com/labs42io/clean-code-typescript)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Command Pattern](https://refactoring.guru/design-patterns/command)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Strategy Pattern](https://refactoring.guru/design-patterns/strategy)
