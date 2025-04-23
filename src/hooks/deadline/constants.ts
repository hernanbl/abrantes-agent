
// Constants for deadline notifications
export type NotificationType = 'reminder7days' | 'reminder3days' | 'reminder1day' | 'expired' | 'supervisorNotification' | 'hrNotification';

// Notification days (days before deadline)
export const NOTIFICATION_DAYS = [7, 3, 1];

// Period for evaluation completion in days (now 60 days from registration)
export const EVALUATION_PERIOD_DAYS = 60;

