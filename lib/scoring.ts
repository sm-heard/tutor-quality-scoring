import type { RiskBandId } from "@/lib/constants"

export type ScoreDriverId =
  | "highNoShow"
  | "highReschedule"
  | "poorFirstSession"
  | "lowRating"
  | "insufficientVolume"

export const SCORE_DRIVERS: Record<ScoreDriverId, string> = {
  highNoShow: "High no-show rate last 30d",
  highReschedule: "High reschedule rate last 30d",
  poorFirstSession: "Poor first-session outcomes",
  lowRating: "Low average rating",
  insufficientVolume: "Not enough data (min 5 sessions)",
}

export type CompositeScoreInput = {
  noShowRate: number
  rescheduleRate: number
  firstSessionFailureRate: number
  averageRating: number | null
  sessionCount: number
}

export type CompositeScoreResult = {
  score: number
  riskBand: RiskBandId
  drivers: ScoreDriverId[]
}

export const SCORE_THRESHOLDS = {
  high: 60,
  medium: 80,
  ratingFloor: 4.3,
  minSessions: 5,
  highNoShowRate: 0.08,
  highRescheduleRate: 0.15,
  highFirstSessionFailRate: 0.2,
  lowRating: 4.0,
}

export function determineRiskBand(score: number): RiskBandId {
  if (score >= SCORE_THRESHOLDS.medium) {
    return "low"
  }
  if (score >= SCORE_THRESHOLDS.high) {
    return "medium"
  }
  return "high"
}

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10))
}

export function calculateCompositeScore(
  input: CompositeScoreInput
): CompositeScoreResult {
  const {
    noShowRate,
    rescheduleRate,
    firstSessionFailureRate,
    averageRating,
    sessionCount,
  } = input

  const drivers: ScoreDriverId[] = []

  if (sessionCount < SCORE_THRESHOLDS.minSessions) {
    drivers.push("insufficientVolume")
  }

  if (noShowRate > SCORE_THRESHOLDS.highNoShowRate) {
    drivers.push("highNoShow")
  }

  if (rescheduleRate > SCORE_THRESHOLDS.highRescheduleRate) {
    drivers.push("highReschedule")
  }

  if (firstSessionFailureRate > SCORE_THRESHOLDS.highFirstSessionFailRate) {
    drivers.push("poorFirstSession")
  }

  if ((averageRating ?? SCORE_THRESHOLDS.ratingFloor) < SCORE_THRESHOLDS.lowRating) {
    drivers.push("lowRating")
  }

  const penaltyRating = Math.max(
    0,
    (SCORE_THRESHOLDS.ratingFloor - (averageRating ?? SCORE_THRESHOLDS.ratingFloor)) *
      12
  )

  let rawScore =
    100 -
    1.4 * noShowRate * 100 -
    1.0 * rescheduleRate * 100 -
    1.2 * firstSessionFailureRate * 100 -
    penaltyRating

  if (sessionCount < SCORE_THRESHOLDS.minSessions) {
    const scale = sessionCount / SCORE_THRESHOLDS.minSessions
    rawScore = Math.min(rawScore, rawScore * scale)
  }

  const score = clampScore(rawScore)

  return {
    score,
    riskBand: determineRiskBand(score),
    drivers,
  }
}
