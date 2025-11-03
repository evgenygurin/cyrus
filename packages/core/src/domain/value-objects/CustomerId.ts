/**
 * Value Object: CustomerId
 * Ensures customer ID validation at the domain level
 */
export class CustomerId {
	private readonly value: string;

	private constructor(value: string) {
		this.value = value;
	}

	public static create(value: string): CustomerId {
		if (!value.startsWith("cus_")) {
			throw new Error(
				'Invalid customer ID format. Customer IDs must start with "cus_"',
			);
		}
		return new CustomerId(value);
	}

	public static createOptional(value?: string): CustomerId | undefined {
		return value ? CustomerId.create(value) : undefined;
	}

	public getValue(): string {
		return this.value;
	}

	public equals(other: CustomerId): boolean {
		return this.value === other.value;
	}

	public toString(): string {
		return this.value;
	}
}
