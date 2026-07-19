export interface AnalyticsOverview {
  totalUsers: number;
  activeUsers: number;
  totalMatches: number;
  completedMatches: number;
  totalRevenue: number;
  averageMatchRating: number;
  userGrowth: number;
  matchGrowth: number;
  revenueGrowth: number;
  completionRate: number;
  activeSeasons: number;
  totalTournaments: number;
}

export interface RevenueData {
  date: string;
  amount: number;
  count: number;
  forecast?: number;
}

export interface ActivityData {
  date: string;
  users: number;
  matches: number;
  payments: number;
  pageViews: number;
}

export interface PerformanceMetric {
  label: string;
  value: number;
  target: number;
  change: number;
  trend: "up" | "down" | "stable";
}

export interface SeasonComparison {
  seasonId: string;
  seasonName: string;
  matches: number;
  players: number;
  revenue: number;
  completionRate: number;
  averageRating: number;
}

export interface Insight {
  id: string;
  type: "positive" | "negative" | "warning" | "info";
  title: string;
  description: string;
  action?: string;
  link?: string;
}

export interface AnalyticsFilters {
  dateRange: {
    from: Date;
    to: Date;
  };
  seasonId?: string;
  metricType?: "revenue" | "activity" | "performance";
}