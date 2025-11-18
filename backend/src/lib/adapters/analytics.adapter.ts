export interface MetricData {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: Date;
}

export interface EventData {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: Date;
}

export interface IAnalyticsAdapter {
  /**
   * Track a metric
   */
  trackMetric(metric: MetricData): Promise<void>;

  /**
   * Track an event
   */
  trackEvent(event: EventData): Promise<void>;

  /**
   * Increment a counter
   */
  incrementCounter(name: string, labels?: Record<string, string>): Promise<void>;

  /**
   * Record a gauge value
   */
  recordGauge(name: string, value: number, labels?: Record<string, string>): Promise<void>;

  /**
   * Record a histogram value (for timing/latency)
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): Promise<void>;

  /**
   * Flush buffered metrics
   */
  flush(): Promise<void>;
}

/**
 * Console-based analytics adapter (development)
 */
export class ConsoleAnalyticsAdapter implements IAnalyticsAdapter {
  private buffer: (MetricData | EventData)[] = [];

  async trackMetric(metric: MetricData): Promise<void> {
    console.log('[METRIC]', {
      name: metric.name,
      value: metric.value,
      labels: metric.labels,
      timestamp: metric.timestamp || new Date(),
    });
    this.buffer.push(metric);
  }

  async trackEvent(event: EventData): Promise<void> {
    console.log('[EVENT]', {
      name: event.name,
      properties: event.properties,
      userId: event.userId,
      timestamp: event.timestamp || new Date(),
    });
    this.buffer.push(event);
  }

  async incrementCounter(name: string, labels?: Record<string, string>): Promise<void> {
    await this.trackMetric({ name, value: 1, labels });
  }

  async recordGauge(name: string, value: number, labels?: Record<string, string>): Promise<void> {
    await this.trackMetric({ name, value, labels });
  }

  async recordHistogram(name: string, value: number, labels?: Record<string, string>): Promise<void> {
    await this.trackMetric({ name, value, labels });
  }

  async flush(): Promise<void> {
    console.log('[ANALYTICS] Flushed', this.buffer.length, 'metrics/events');
    this.buffer = [];
  }
}
