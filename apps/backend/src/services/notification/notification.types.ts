export interface NotificationPayload {
  userIds: number[];
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface INotificationStrategy {
  send(payload: NotificationPayload): Promise<void>;
}
