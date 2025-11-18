export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  tenantId: string;
  userId?: string;
  timestamp: Date;
  data: Record<string, any>;
}

export enum EventType {
  // Staff events
  STAFF_CREATED = 'staff.created',
  STAFF_UPDATED = 'staff.updated',
  STAFF_DELETED = 'staff.deleted',

  // Shift assignment events
  SHIFT_ASSIGNED = 'shift.assigned',
  SHIFT_UPDATED = 'shift.updated',
  SHIFT_CANCELLED = 'shift.cancelled',
  SCHEDULE_PUBLISHED = 'schedule.published',

  // Swap events
  SWAP_REQUESTED = 'swap.requested',
  SWAP_APPROVED = 'swap.approved',
  SWAP_REJECTED = 'swap.rejected',
  SWAP_COMPLETED = 'swap.completed',

  // Leave events
  LEAVE_REQUESTED = 'leave.requested',
  LEAVE_APPROVED = 'leave.approved',
  LEAVE_REJECTED = 'leave.rejected',

  // Department events
  DEPARTMENT_CREATED = 'department.created',
  DEPARTMENT_UPDATED = 'department.updated',
  DEPARTMENT_DELETED = 'department.deleted',
  STAFF_ASSIGNED_TO_DEPARTMENT = 'department.staff_assigned',

  // Notification events
  NOTIFICATION_SENT = 'notification.sent',
}

export type DomainEventHandler = (event: DomainEvent) => Promise<void> | void;

/**
 * Simple in-memory event bus
 */
export class EventBus {
  private handlers: Map<string, DomainEventHandler[]> = new Map();
  private eventLog: DomainEvent[] = [];

  /**
   * Subscribe to an event type
   */
  subscribe(eventType: string, handler: DomainEventHandler): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  /**
   * Publish an event
   */
  async publish(event: DomainEvent): Promise<void> {
    // Log event
    this.eventLog.push(event);

    // Get handlers for this event type
    const handlers = this.handlers.get(event.eventType) || [];

    // Also get wildcard handlers
    const wildcardHandlers = this.handlers.get('*') || [];

    // Execute all handlers
    const allHandlers = [...handlers, ...wildcardHandlers];
    await Promise.all(allHandlers.map((handler) => handler(event)));
  }

  /**
   * Get event log
   */
  getEventLog(filter?: { aggregateId?: string; aggregateType?: string; tenantId?: string }): DomainEvent[] {
    if (!filter) {
      return this.eventLog;
    }

    return this.eventLog.filter((event) => {
      if (filter.aggregateId && event.aggregateId !== filter.aggregateId) return false;
      if (filter.aggregateType && event.aggregateType !== filter.aggregateType) return false;
      if (filter.tenantId && event.tenantId !== filter.tenantId) return false;
      return true;
    });
  }

  /**
   * Clear event log (for testing)
   */
  clearEventLog(): void {
    this.eventLog = [];
  }

  /**
   * Unsubscribe from an event type
   */
  unsubscribe(eventType: string, handler: DomainEventHandler): void {
    const handlers = this.handlers.get(eventType) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
      this.handlers.set(eventType, handlers);
    }
  }
}

// Global event bus instance
export const eventBus = new EventBus();

/**
 * Helper function to create a domain event
 */
export function createDomainEvent(params: {
  eventType: EventType | string;
  aggregateId: string;
  aggregateType: string;
  tenantId: string;
  userId?: string;
  data: Record<string, any>;
}): DomainEvent {
  return {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    eventType: params.eventType,
    aggregateId: params.aggregateId,
    aggregateType: params.aggregateType,
    tenantId: params.tenantId,
    userId: params.userId,
    timestamp: new Date(),
    data: params.data,
  };
}

/**
 * Simplified helper - infers aggregateType from eventType
 */
export function createEvent(
  eventType: EventType | string,
  aggregateId: string,
  tenantId: string,
  data: Record<string, any>,
  userId?: string,
): DomainEvent {
  // Infer aggregate type from event type (e.g., "staff.created" -> "staff")
  const aggregateType = eventType.split('.')[0];

  return createDomainEvent({
    eventType,
    aggregateId,
    aggregateType,
    tenantId,
    userId,
    data,
  });
}
