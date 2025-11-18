export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: string;
  data?: Record<string, any>;
}

export interface EmailNotificationPayload extends NotificationPayload {
  to: string;
  subject: string;
  html?: string;
}

export interface SMSNotificationPayload extends NotificationPayload {
  phoneNumber: string;
}

export interface PushNotificationPayload extends NotificationPayload {
  deviceTokens: string[];
}

export interface INotificationAdapter {
  /**
   * Send a notification to a user
   */
  send(payload: NotificationPayload): Promise<void>;

  /**
   * Send an email notification
   */
  sendEmail?(payload: EmailNotificationPayload): Promise<void>;

  /**
   * Send an SMS notification
   */
  sendSMS?(payload: SMSNotificationPayload): Promise<void>;

  /**
   * Send a push notification
   */
  sendPush?(payload: PushNotificationPayload): Promise<void>;

  /**
   * Send a batch of notifications
   */
  sendBatch?(payloads: NotificationPayload[]): Promise<void>;
}

/**
 * Console-based notification adapter (development)
 */
export class ConsoleNotificationAdapter implements INotificationAdapter {
  async send(payload: NotificationPayload): Promise<void> {
    console.log('[NOTIFICATION]', {
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      timestamp: new Date().toISOString(),
    });
  }

  async sendEmail(payload: EmailNotificationPayload): Promise<void> {
    console.log('[EMAIL]', {
      to: payload.to,
      subject: payload.subject,
      timestamp: new Date().toISOString(),
    });
  }

  async sendSMS(payload: SMSNotificationPayload): Promise<void> {
    console.log('[SMS]', {
      phoneNumber: payload.phoneNumber,
      message: payload.message,
      timestamp: new Date().toISOString(),
    });
  }

  async sendPush(payload: PushNotificationPayload): Promise<void> {
    console.log('[PUSH]', {
      deviceTokens: payload.deviceTokens,
      title: payload.title,
      message: payload.message,
      timestamp: new Date().toISOString(),
    });
  }

  async sendBatch(payloads: NotificationPayload[]): Promise<void> {
    console.log('[BATCH NOTIFICATION]', {
      count: payloads.length,
      timestamp: new Date().toISOString(),
    });
    for (const payload of payloads) {
      await this.send(payload);
    }
  }
}
