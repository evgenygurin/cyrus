import { resolve } from "node:path";

/**
 * Value Object: RepositoryPath
 * Ensures path validation and normalization
 */
export class RepositoryPath {
	private readonly value: string;

	private constructor(value: string) {
		this.value = value;
	}

	public static create(value: string): RepositoryPath {
		if (!value || value.trim() === "") {
			throw new Error("Repository path cannot be empty");
		}
		// Normalize and resolve to absolute path
		const normalized = resolve(value);
		return new RepositoryPath(normalized);
	}

	public getValue(): string {
		return this.value;
	}

	public getBasename(): string {
		return this.value.split("/").pop() || "";
	}

	public equals(other: RepositoryPath): boolean {
		return this.value === other.value;
	}

	public toString(): string {
		return this.value;
	}
}
