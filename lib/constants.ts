export const RISK_BANDS = [
  {
    id: "low" as const,
    label: "Low",
    minScore: 80,
    maxScore: 100,
    color: "#10b981",
    accent: "bg-[color:#10b981]/15 text-[color:#10b981] border-[color:#10b981]/30",
  },
  {
    id: "medium" as const,
    label: "Medium",
    minScore: 60,
    maxScore: 79.99,
    color: "#f59e0b",
    accent: "bg-[color:#f59e0b]/15 text-[color:#f59e0b] border-[color:#f59e0b]/30",
  },
  {
    id: "high" as const,
    label: "High",
    minScore: 0,
    maxScore: 59.99,
    color: "#ef4444",
    accent: "bg-[color:#ef4444]/15 text-[color:#ef4444] border-[color:#ef4444]/30",
  },
]

export type RiskBandId = (typeof RISK_BANDS)[number]["id"]

export const CHART_SERIES = {
  noShow: { label: "No-Show Rate", color: "#ef4444" },
  reschedule: { label: "Reschedule Rate", color: "#f59e0b" },
  firstSessionFail: { label: "First Session Fail Rate", color: "#8b5cf6" },
  averageRating: { label: "Average Rating", color: "#10b981" },
  compositeScore: { label: "Composite Score", color: "#06b6d4" },
}

export const DEFAULT_TIME_RANGE_DAYS = 30

