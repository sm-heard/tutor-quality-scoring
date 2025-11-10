export const RISK_BANDS = [
  {
    id: "low" as const,
    label: "Low",
    minScore: 80,
    maxScore: 100,
    color: "#1A936F",
    accent: "bg-[color:#1A936F]/15 text-[color:#0F5C45] border-transparent",
  },
  {
    id: "medium" as const,
    label: "Medium",
    minScore: 60,
    maxScore: 79.99,
    color: "#F2BF49",
    accent: "bg-[color:#F2BF49]/15 text-[color:#8A6400] border-transparent",
  },
  {
    id: "high" as const,
    label: "High",
    minScore: 0,
    maxScore: 59.99,
    color: "#D64545",
    accent: "bg-[color:#D64545]/15 text-[color:#7A1E1E] border-transparent",
  },
]

export type RiskBandId = (typeof RISK_BANDS)[number]["id"]

export const CHART_SERIES = {
  noShow: { label: "No-Show Rate", color: "#D64545" },
  reschedule: { label: "Reschedule Rate", color: "#F2BF49" },
  firstSessionFail: { label: "First Session Fail Rate", color: "#7C5E99" },
  averageRating: { label: "Average Rating", color: "#1A936F" },
  compositeScore: { label: "Composite Score", color: "#2A70D8" },
}

export const DEFAULT_TIME_RANGE_DAYS = 30

