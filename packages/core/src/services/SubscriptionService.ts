import { Failure, type Result, Success } from "../domain/Result.js";
import type { CustomerId } from "../domain/value-objects/index.js";

/**
 * Subscription status returned from API
 */
export interface SubscriptionStatus {
	hasActiveSubscription: boolean;
	status: string;
	requiresPayment: boolean;
	isReturningCustomer?: boolean;
}

/**
 * Subscription Service
 * Single Responsibility: Manage subscription validation and status
 */
export class SubscriptionService {
	private readonly apiBaseUrl: string;

	constructor(apiBaseUrl = "https://www.atcyrus.com") {
		this.apiBaseUrl = apiBaseUrl;
	}

	/**
	 * Check subscription status with the Cyrus API
	 */
	public async checkStatus(
		customerId: CustomerId,
	): Promise<Result<SubscriptionStatus, Error>> {
		try {
			const response = await fetch(
				`${this.apiBaseUrl}/api/subscription-status?customerId=${encodeURIComponent(customerId.getValue())}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			if (!response.ok) {
				if (response.status === 400) {
					const data = (await response.json()) as { error?: string };
					return new Failure(
						new Error(data.error || "Invalid customer ID format"),
					);
				}
				return new Failure(new Error(`HTTP error! status: ${response.status}`));
			}

			const data = (await response.json()) as SubscriptionStatus;
			return new Success(data);
		} catch (error) {
			return new Failure(
				error instanceof Error ? error : new Error(String(error)),
			);
		}
	}

	/**
	 * Validate that subscription is active and payment is not required
	 */
	public async validate(
		customerId: CustomerId,
	): Promise<Result<SubscriptionStatus, SubscriptionError>> {
		const statusResult = await this.checkStatus(customerId);

		if (statusResult.isFailure) {
			return new Failure(
				new SubscriptionError(
					"VALIDATION_FAILED",
					`Failed to validate subscription: ${statusResult.error.message}`,
					statusResult.error,
				),
			);
		}

		const status = statusResult.value;

		if (status.requiresPayment) {
			return new Failure(
				new SubscriptionError(
					status.isReturningCustomer
						? "SUBSCRIPTION_EXPIRED"
						: "NO_SUBSCRIPTION",
					status.isReturningCustomer
						? `Subscription has expired (status: ${status.status})`
						: "No active subscription found",
					undefined,
					status,
				),
			);
		}

		return new Success(status);
	}

	/**
	 * Get billing portal URL
	 */
	public getBillingPortalUrl(customerId: CustomerId): string {
		return `${this.apiBaseUrl}/billing/${customerId.getValue()}`;
	}
}

/**
 * Custom error type for subscription-related errors
 */
export class SubscriptionError extends Error {
	constructor(
		public readonly code:
			| "VALIDATION_FAILED"
			| "SUBSCRIPTION_EXPIRED"
			| "NO_SUBSCRIPTION",
		message: string,
		public readonly cause?: Error,
		public readonly status?: SubscriptionStatus,
	) {
		super(message);
		this.name = "SubscriptionError";
	}
}
