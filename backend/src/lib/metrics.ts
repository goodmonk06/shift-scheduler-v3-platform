import { IAnalyticsAdapter, ConsoleAnalyticsAdapter } from './adapters/analytics.adapter';

export class MetricsService {
  private adapter: IAnalyticsAdapter;

  constructor(adapter?: IAnalyticsAdapter) {
    this.adapter = adapter || new ConsoleAnalyticsAdapter();
  }

  /**
   * Increment a counter by 1
   */
  async incrementCounter(name: string, labels?: Record<string, string>): Promise<void> {
    await this.adapter.incrementCounter(name, labels);
  }

  /**
   * Record a gauge value (current state)
   */
  async recordGauge(name: string, value: number, labels?: Record<string, string>): Promise<void> {
    await this.adapter.recordGauge(name, value, labels);
  }

  /**
   * Record a histogram value (timing/duration)
   */
  async recordHistogram(name: string, value: number, labels?: Record<string, string>): Promise<void> {
    await this.adapter.recordHistogram(name, value, labels);
  }

  /**
   * Track an event
   */
  async trackEvent(name: string, properties?: Record<string, any>, userId?: string): Promise<void> {
    await this.adapter.trackEvent({ name, properties, userId });
  }

  /**
   * Measure execution time of a function
   */
  async measureTime<T>(
    name: string,
    fn: () => Promise<T> | T,
    labels?: Record<string, string>,
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      await this.recordHistogram(`${name}_duration_ms`, duration, labels);
      await this.incrementCounter(`${name}_total`, { ...labels, status: 'success' });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      await this.recordHistogram(`${name}_duration_ms`, duration, labels);
      await this.incrementCounter(`${name}_total`, { ...labels, status: 'error' });
      throw error;
    }
  }

  /**
   * Flush buffered metrics
   */
  async flush(): Promise<void> {
    await this.adapter.flush();
  }
}

// Global metrics instance
export const metrics = new MetricsService();

// Common metric names
export const MetricNames = {
  // HTTP metrics
  HTTP_REQUEST_TOTAL: 'http_request_total',
  HTTP_REQUEST_DURATION: 'http_request_duration_ms',
  HTTP_REQUEST_SIZE: 'http_request_size_bytes',
  HTTP_RESPONSE_SIZE: 'http_response_size_bytes',

  // Database metrics
  DB_QUERY_TOTAL: 'db_query_total',
  DB_QUERY_DURATION: 'db_query_duration_ms',
  DB_CONNECTION_POOL_SIZE: 'db_connection_pool_size',

  // Business metrics
  STAFF_CREATED: 'staff_created_total',
  SHIFT_ASSIGNED: 'shift_assigned_total',
  SWAP_REQUESTED: 'swap_requested_total',
  LEAVE_REQUESTED: 'leave_requested_total',
  SCHEDULE_GENERATED: 'schedule_generated_total',
  DEPARTMENT_CREATED: 'department_created_total',

  // Application metrics
  ACTIVE_USERS: 'active_users',
  ACTIVE_TENANTS: 'active_tenants',
  CACHE_HIT_RATE: 'cache_hit_rate',
};
