import type { MetricsSnapshot } from '../../types/dtos'

export interface MetricsCollector {
  recordLatency(operation: string, durationMs: number, labels?: Record<string, string>): void
  recordError(operation: string, errorType: string, labels?: Record<string, string>): void
  incrementCounter(metric: string, labels?: Record<string, string>): void
  getMetrics(): MetricsSnapshot
  reset(): void
}
