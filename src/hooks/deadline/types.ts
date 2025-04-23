
export interface UseDeadlineProps {
  userId?: string;
  reviewId?: string;
}

export interface DeadlineInfo {
  isExpired: boolean;
  daysRemaining: number;
  deadlineDate: Date | null;
  formattedDeadline: string;
}
