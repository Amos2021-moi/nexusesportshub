export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: number;
  priorityLevel: PriorityLevel;
  reason: string;
  channel: NotificationChannel;
  link: string | null;
  read: boolean;
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
}

export type NotificationType =
  | "MATCH_RESULT_PENDING"
  | "MATCH_RESULT_APPROVED"
  | "MATCH_RESULT_REJECTED"
  | "NEW_FIXTURE"
  | "FIXTURE_REMINDER"
  | "TOURNAMENT_START"
  | "TOURNAMENT_UPDATE"
  | "TOURNAMENT_COMPLETED"
  | "AWARD_EARNED"
  | "SEASON_UPDATE"
  | "REGISTRATION_CLOSING"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_FAILED"
  | "NEWS_PUBLISHED"
  | "COMMUNITY_REPLY"
  | "COMMUNITY_LIKE"
  | "SYSTEM_ALERT"
  | "ADMIN_ALERT";

export type PriorityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type NotificationChannel = "IN_APP" | "PUSH" | "EMAIL" | "SMS" | "WHATSAPP";

export interface NotificationPreference {
  id: string;
  userId: string;
  pushEnabled: boolean;
  pushQuietHours: { start: string; end: string } | null;
  emailEnabled: boolean;
  emailDigest: "DAILY" | "WEEKLY" | "NEVER";
  minPriorityPush: number;
  minPriorityInApp: number;
  matchReminders: boolean;
  resultApproved: boolean;
  tournamentUpdates: boolean;
  newsAlerts: boolean;
  communityAlerts: boolean;
  systemAlerts: boolean;
}

export interface SmartNotificationResponse {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export interface DigestNotification {
  critical: Notification[];
  high: Notification[];
  medium: Notification[];
  low: Notification[];
  total: number;
  date: string;
}