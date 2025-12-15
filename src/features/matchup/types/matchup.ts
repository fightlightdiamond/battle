/**
 * Matchup types for the Matchup Betting System
 * Requirements: 1.2, 3.1
 */

/**
 * Matchup status
 */
export type MatchupStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";

/**
 * Matchup record stored in json-server
 */
export interface Matchup {
  id: string;
  card1Id: string;
  card1Name: string;
  card2Id: string;
  card2Name: string;
  status: MatchupStatus;
  winnerId: string | null;
  winnerName: string | null;
  battleHistoryId: string | null;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
}

/**
 * Bet status
 */
export type BetStatus = "active" | "won" | "lost" | "cancelled" | "refunded";

/**
 * Matchup bet record stored in json-server
 */
export interface MatchupBet {
  id: string;
  matchupId: string;
  selectedCardId: string;
  selectedCardName: string;
  betAmount: number;
  status: BetStatus;
  payoutAmount: number | null;
  createdAt: number;
  updatedAt: number;
  resolvedAt: number | null;
}

/**
 * Create matchup request
 */
export interface CreateMatchupRequest {
  card1Id: string;
  card1Name: string;
  card2Id: string;
  card2Name: string;
}

/**
 * Place bet request
 */
export interface PlaceBetRequest {
  matchupId: string;
  selectedCardId: string;
  selectedCardName: string;
  betAmount: number;
}

/**
 * Update bet request
 */
export interface UpdateBetRequest {
  betId: string;
  newAmount: number;
}

/**
 * Serializes a Matchup object to JSON string
 */
export function serializeMatchup(matchup: Matchup): string {
  return JSON.stringify(matchup);
}

/**
 * Deserializes a JSON string to a Matchup object
 * Validates the structure and returns the parsed object
 * @throws Error if the JSON is invalid or structure is incorrect
 */
export function deserializeMatchup(json: string): Matchup {
  const parsed = JSON.parse(json);

  // Validate required fields
  if (typeof parsed.id !== "string") {
    throw new Error("Invalid matchup: id must be a string");
  }
  if (typeof parsed.card1Id !== "string") {
    throw new Error("Invalid matchup: card1Id must be a string");
  }
  if (typeof parsed.card1Name !== "string") {
    throw new Error("Invalid matchup: card1Name must be a string");
  }
  if (typeof parsed.card2Id !== "string") {
    throw new Error("Invalid matchup: card2Id must be a string");
  }
  if (typeof parsed.card2Name !== "string") {
    throw new Error("Invalid matchup: card2Name must be a string");
  }
  if (!isValidMatchupStatus(parsed.status)) {
    throw new Error("Invalid matchup: status must be a valid MatchupStatus");
  }
  if (typeof parsed.createdAt !== "number") {
    throw new Error("Invalid matchup: createdAt must be a number");
  }

  // Validate nullable fields
  if (parsed.winnerId !== null && typeof parsed.winnerId !== "string") {
    throw new Error("Invalid matchup: winnerId must be a string or null");
  }
  if (parsed.winnerName !== null && typeof parsed.winnerName !== "string") {
    throw new Error("Invalid matchup: winnerName must be a string or null");
  }
  if (
    parsed.battleHistoryId !== null &&
    typeof parsed.battleHistoryId !== "string"
  ) {
    throw new Error(
      "Invalid matchup: battleHistoryId must be a string or null"
    );
  }
  if (parsed.startedAt !== null && typeof parsed.startedAt !== "number") {
    throw new Error("Invalid matchup: startedAt must be a number or null");
  }
  if (parsed.completedAt !== null && typeof parsed.completedAt !== "number") {
    throw new Error("Invalid matchup: completedAt must be a number or null");
  }

  return parsed as Matchup;
}

/**
 * Type guard for MatchupStatus
 */
export function isValidMatchupStatus(status: unknown): status is MatchupStatus {
  return (
    status === "pending" ||
    status === "in_progress" ||
    status === "completed" ||
    status === "cancelled"
  );
}

/**
 * Type guard for BetStatus
 */
export function isValidBetStatus(status: unknown): status is BetStatus {
  return (
    status === "active" ||
    status === "won" ||
    status === "lost" ||
    status === "cancelled" ||
    status === "refunded"
  );
}
