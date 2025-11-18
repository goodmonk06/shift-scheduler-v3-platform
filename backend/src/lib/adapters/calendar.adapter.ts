export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  metadata?: Record<string, any>;
}

export interface ICalendarAdapter {
  /**
   * Create a calendar event
   */
  createEvent(event: CalendarEvent): Promise<string>;

  /**
   * Update a calendar event
   */
  updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<void>;

  /**
   * Delete a calendar event
   */
  deleteEvent(eventId: string): Promise<void>;

  /**
   * Get events within a date range
   */
  getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]>;

  /**
   * Sync events with external calendar
   */
  sync(): Promise<void>;
}

/**
 * In-memory calendar adapter (development)
 */
export class InMemoryCalendarAdapter implements ICalendarAdapter {
  private events: Map<string, CalendarEvent> = new Map();
  private nextId = 1;

  async createEvent(event: CalendarEvent): Promise<string> {
    const id = event.id || `event-${this.nextId++}`;
    this.events.set(id, { ...event, id });
    console.log('[CALENDAR] Event created:', id);
    return id;
  }

  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<void> {
    const existing = this.events.get(eventId);
    if (!existing) {
      throw new Error(`Event not found: ${eventId}`);
    }
    this.events.set(eventId, { ...existing, ...event });
    console.log('[CALENDAR] Event updated:', eventId);
  }

  async deleteEvent(eventId: string): Promise<void> {
    this.events.delete(eventId);
    console.log('[CALENDAR] Event deleted:', eventId);
  }

  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.startTime >= startDate && event.endTime <= endDate,
    );
  }

  async sync(): Promise<void> {
    console.log('[CALENDAR] Sync completed:', this.events.size, 'events');
  }
}
