/**
 * Value Object: LinearToken
 * Encapsulates Linear OAuth token validation
 */
export class LinearToken {
	private readonly value: string;

	private constructor(value: string) {
		this.value = value;
	}

	public static create(value: string): LinearToken {
		if (!value.startsWith("lin_oauth_")) {
			throw new Error(
				'Invalid Linear token format. Tokens must start with "lin_oauth_"',
			);
		}
		return new LinearToken(value);
	}

	public getValue(): string {
		return this.value;
	}

	public getMasked(): string {
		return `...${this.value.slice(-4)}`;
	}

	public equals(other: LinearToken): boolean {
		return this.value === other.value;
	}

	public toString(): string {
		return this.value;
	}
}
