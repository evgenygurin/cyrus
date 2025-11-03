/**
 * Performance metrics for an operation
 */
export interface PerformanceMetrics {
	operationName: string;
	startTime: number;
	endTime: number;
	duration: number;
	memoryBefore: NodeJS.MemoryUsage;
	memoryAfter: NodeJS.MemoryUsage;
	memoryDelta: {
		heapUsed: number;
		heapTotal: number;
		external: number;
		rss: number;
	};
	success: boolean;
	error?: Error;
}

/**
 * Aggregated performance statistics
 */
export interface PerformanceStats {
	operationName: string;
	count: number;
	successCount: number;
	failureCount: number;
	avgDuration: number;
	minDuration: number;
	maxDuration: number;
	p50Duration: number;
	p95Duration: number;
	p99Duration: number;
	avgMemoryDelta: number;
}

/**
 * Performance monitoring service
 * Tracks operation metrics and provides insights
 */
export class PerformanceMonitor {
	private metrics: Map<string, PerformanceMetrics[]> = new Map();
	private maxMetricsPerOperation = 1000;

	/**
	 * Track an operation's performance
	 */
	async track<T>(
		operationName: string,
		operation: () => Promise<T>,
	): Promise<T> {
		const startTime = performance.now();
		const memoryBefore = process.memoryUsage();

		try {
			const result = await operation();

			const endTime = performance.now();
			const memoryAfter = process.memoryUsage();

			this.recordMetrics({
				operationName,
				startTime,
				endTime,
				duration: endTime - startTime,
				memoryBefore,
				memoryAfter,
				memoryDelta: {
					heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
					heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
					external: memoryAfter.external - memoryBefore.external,
					rss: memoryAfter.rss - memoryBefore.rss,
				},
				success: true,
			});

			return result;
		} catch (error) {
			const endTime = performance.now();
			const memoryAfter = process.memoryUsage();

			this.recordMetrics({
				operationName,
				startTime,
				endTime,
				duration: endTime - startTime,
				memoryBefore,
				memoryAfter,
				memoryDelta: {
					heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
					heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
					external: memoryAfter.external - memoryBefore.external,
					rss: memoryAfter.rss - memoryBefore.rss,
				},
				success: false,
				error: error as Error,
			});

			throw error;
		}
	}

	/**
	 * Record metrics for an operation
	 */
	private recordMetrics(metrics: PerformanceMetrics): void {
		const operationMetrics = this.metrics.get(metrics.operationName) || [];

		operationMetrics.push(metrics);

		// Keep only the most recent metrics to prevent memory leaks
		if (operationMetrics.length > this.maxMetricsPerOperation) {
			operationMetrics.shift();
		}

		this.metrics.set(metrics.operationName, operationMetrics);
	}

	/**
	 * Get aggregated statistics for an operation
	 */
	getStats(operationName: string): PerformanceStats | undefined {
		const operationMetrics = this.metrics.get(operationName);

		if (!operationMetrics || operationMetrics.length === 0) {
			return undefined;
		}

		const durations = operationMetrics
			.map((m) => m.duration)
			.sort((a, b) => a - b);
		const memoryDeltas = operationMetrics.map((m) => m.memoryDelta.heapUsed);

		return {
			operationName,
			count: operationMetrics.length,
			successCount: operationMetrics.filter((m) => m.success).length,
			failureCount: operationMetrics.filter((m) => !m.success).length,
			avgDuration: this.average(durations),
			minDuration: Math.min(...durations),
			maxDuration: Math.max(...durations),
			p50Duration: this.percentile(durations, 50),
			p95Duration: this.percentile(durations, 95),
			p99Duration: this.percentile(durations, 99),
			avgMemoryDelta: this.average(memoryDeltas),
		};
	}

	/**
	 * Get all tracked operation names
	 */
	getOperationNames(): string[] {
		return Array.from(this.metrics.keys());
	}

	/**
	 * Get stats for all operations
	 */
	getAllStats(): PerformanceStats[] {
		return this.getOperationNames()
			.map((name) => this.getStats(name))
			.filter((stats): stats is PerformanceStats => stats !== undefined);
	}

	/**
	 * Clear metrics for an operation
	 */
	clearMetrics(operationName: string): void {
		this.metrics.delete(operationName);
	}

	/**
	 * Clear all metrics
	 */
	clearAllMetrics(): void {
		this.metrics.clear();
	}

	/**
	 * Calculate average of numbers
	 */
	private average(numbers: number[]): number {
		if (numbers.length === 0) return 0;
		return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
	}

	/**
	 * Calculate percentile
	 */
	private percentile(sortedNumbers: number[], percentile: number): number {
		if (sortedNumbers.length === 0) return 0;

		const index = Math.ceil((percentile / 100) * sortedNumbers.length) - 1;
		return sortedNumbers[Math.max(0, index)] || 0;
	}

	/**
	 * Set maximum metrics to keep per operation
	 */
	setMaxMetricsPerOperation(max: number): void {
		this.maxMetricsPerOperation = max;
	}
}

/**
 * Decorator for tracking method performance
 */
export function TrackPerformance(operationName?: string) {
	return (
		_target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) => {
		const originalMethod = descriptor.value;
		const finalOperationName =
			operationName || `${_target.constructor.name}.${propertyKey}`;

		descriptor.value = async function (...args: any[]) {
			const monitor = new PerformanceMonitor();
			return monitor.track(finalOperationName, () =>
				originalMethod.apply(this, args),
			);
		};

		return descriptor;
	};
}
