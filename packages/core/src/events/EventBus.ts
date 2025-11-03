import type { DomainEvent } from "./DomainEvent.js";

/**
 * Event handler function type
 */
export type EventHandler<T extends DomainEvent = DomainEvent> = (
	event: T,
) => Promise<void> | void;

/**
 * Event subscription
 */
interface EventSubscription {
	id: string;
	eventType: string;
	handler: EventHandler;
}

/**
 * Event bus for publishing and subscribing to domain events
 * Implements the Observer pattern for event-driven architecture
 */
export class EventBus {
	private subscriptions: Map<string, EventSubscription[]> = new Map();
	private eventHistory: DomainEvent[] = [];
	private maxHistorySize = 100;

	/**
	 * Publish an event to all registered handlers
	 */
	async publish<T extends DomainEvent>(event: T): Promise<void> {
		// Store in history
		this.storeInHistory(event);

		// Get handlers for this event type
		const handlers = this.subscriptions.get(event.eventType) || [];

		// Execute all handlers in parallel
		const promises = handlers.map((subscription) =>
			this.executeHandler(subscription.handler, event),
		);

		await Promise.all(promises);
	}

	/**
	 * Publish multiple events
	 */
	async publishAll(events: DomainEvent[]): Promise<void> {
		await Promise.all(events.map((event) => this.publish(event)));
	}

	/**
	 * Subscribe to an event type
	 */
	subscribe<T extends DomainEvent>(
		eventType: string,
		handler: EventHandler<T>,
	): string {
		const subscriptionId = this.generateSubscriptionId();

		const subscription: EventSubscription = {
			id: subscriptionId,
			eventType,
			handler: handler as EventHandler,
		};

		const eventSubscriptions = this.subscriptions.get(eventType) || [];
		eventSubscriptions.push(subscription);
		this.subscriptions.set(eventType, eventSubscriptions);

		return subscriptionId;
	}

	/**
	 * Subscribe to multiple event types with the same handler
	 */
	subscribeToMany<T extends DomainEvent>(
		eventTypes: string[],
		handler: EventHandler<T>,
	): string[] {
		return eventTypes.map((eventType) => this.subscribe(eventType, handler));
	}

	/**
	 * Unsubscribe from an event
	 */
	unsubscribe(subscriptionId: string): boolean {
		for (const [eventType, subscriptions] of this.subscriptions.entries()) {
			const index = subscriptions.findIndex((s) => s.id === subscriptionId);

			if (index !== -1) {
				subscriptions.splice(index, 1);

				if (subscriptions.length === 0) {
					this.subscriptions.delete(eventType);
				}

				return true;
			}
		}

		return false;
	}

	/**
	 * Unsubscribe all handlers for an event type
	 */
	unsubscribeAll(eventType: string): void {
		this.subscriptions.delete(eventType);
	}

	/**
	 * Clear all subscriptions
	 */
	clear(): void {
		this.subscriptions.clear();
	}

	/**
	 * Get event history
	 */
	getEventHistory(): DomainEvent[] {
		return [...this.eventHistory];
	}

	/**
	 * Get events of a specific type from history
	 */
	getEventsByType(eventType: string): DomainEvent[] {
		return this.eventHistory.filter((event) => event.eventType === eventType);
	}

	/**
	 * Clear event history
	 */
	clearHistory(): void {
		this.eventHistory = [];
	}

	/**
	 * Set maximum event history size
	 */
	setMaxHistorySize(size: number): void {
		this.maxHistorySize = size;

		// Trim history if needed
		if (this.eventHistory.length > size) {
			this.eventHistory = this.eventHistory.slice(-size);
		}
	}

	/**
	 * Get subscription count for an event type
	 */
	getSubscriptionCount(eventType: string): number {
		return (this.subscriptions.get(eventType) || []).length;
	}

	/**
	 * Execute a handler with error handling
	 */
	private async executeHandler(
		handler: EventHandler,
		event: DomainEvent,
	): Promise<void> {
		try {
			await handler(event);
		} catch (error) {
			console.error(
				`Error executing event handler for ${event.eventType}:`,
				error,
			);
			// Optionally: publish an ErrorEvent
		}
	}

	/**
	 * Store event in history
	 */
	private storeInHistory(event: DomainEvent): void {
		this.eventHistory.push(event);

		// Keep history size under control
		if (this.eventHistory.length > this.maxHistorySize) {
			this.eventHistory.shift();
		}
	}

	/**
	 * Generate unique subscription ID
	 */
	private generateSubscriptionId(): string {
		return `sub-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
	}
}

/**
 * Singleton instance of the event bus
 */
export const eventBus = new EventBus();
