import type { MetricsCollector } from '../ports/observability/metrics'
import type { MetricsSnapshot } from '../types/dtos'

/**
 * InMemoryMetricsCollector — Recolecta métricas en memoria.
 *
 * Expone métricas vía getMetrics() en formato compatible con Prometheus scrape.
 * Se pierde en restart (aceptable por restricción $0).
 *
 * Métricas recolectadas:
 * - Counters: operaciones totales, errores por tipo
 * - Histograms: latencia por operación (p50, p95, p99)
 */
export class InMemoryMetricsCollector implements MetricsCollector {
  private counters = new Map<string, number>()
  private latencies = new Map<string, number[]>()

  recordLatency(operation: string, durationMs: number, labels?: Record<string, string>): void {
    const key = this.buildKey(operation, labels)
    if (!this.latencies.has(key)) {
      this.latencies.set(key, [])
    }
    const values = this.latencies.get(key)!
    values.push(durationMs)

    // Mantener máximo 1000 muestras por operación (sliding window)
    if (values.length > 1000) {
      values.shift()
    }

    // También incrementar counter de operaciones
    this.incrementCounter(`${operation}_total`, labels)
  }

  recordError(operation: string, errorType: string, labels?: Record<string, string>): void {
    const key = this.buildKey(`${operation}_error_${errorType}`, labels)
    this.counters.set(key, (this.counters.get(key) || 0) + 1)
  }

  incrementCounter(metric: string, labels?: Record<string, string>): void {
    const key = this.buildKey(metric, labels)
    this.counters.set(key, (this.counters.get(key) || 0) + 1)
  }

  getMetrics(): MetricsSnapshot {
    const countersObj: Record<string, number> = {}
    for (const [key, value] of this.counters) {
      countersObj[key] = value
    }

    const histograms: Record<string, { count: number; sum: number; p50: number; p95: number; p99: number }> = {}
    for (const [key, values] of this.latencies) {
      if (values.length === 0) continue
      const sorted = [...values].sort((a, b) => a - b)
      histograms[key] = {
        count: sorted.length,
        sum: sorted.reduce((a, b) => a + b, 0),
        p50: this.percentile(sorted, 50),
        p95: this.percentile(sorted, 95),
        p99: this.percentile(sorted, 99),
      }
    }

    return {
      counters: countersObj,
      histograms,
      timestamp: new Date().toISOString(),
    }
  }

  reset(): void {
    this.counters.clear()
    this.latencies.clear()
  }

  /**
   * Exporta métricas en formato Prometheus exposition format.
   */
  toPrometheus(): string {
    const lines: string[] = []

    // Counters
    for (const [key, value] of this.counters) {
      const metricName = key.replace(/[^a-zA-Z0-9_]/g, '_')
      lines.push(`# TYPE ${metricName} counter`)
      lines.push(`${metricName} ${value}`)
    }

    // Histograms (simplified as gauges for p50/p95/p99)
    for (const [key, values] of this.latencies) {
      if (values.length === 0) continue
      const sorted = [...values].sort((a, b) => a - b)
      const metricName = key.replace(/[^a-zA-Z0-9_]/g, '_')
      lines.push(`# TYPE ${metricName}_duration_ms summary`)
      lines.push(`${metricName}_duration_ms{quantile="0.5"} ${this.percentile(sorted, 50)}`)
      lines.push(`${metricName}_duration_ms{quantile="0.95"} ${this.percentile(sorted, 95)}`)
      lines.push(`${metricName}_duration_ms{quantile="0.99"} ${this.percentile(sorted, 99)}`)
      lines.push(`${metricName}_duration_ms_count ${sorted.length}`)
      lines.push(`${metricName}_duration_ms_sum ${sorted.reduce((a, b) => a + b, 0)}`)
    }

    return lines.join('\n')
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  private buildKey(metric: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) return metric
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',')
    return `${metric}{${labelStr}}`
  }
}
