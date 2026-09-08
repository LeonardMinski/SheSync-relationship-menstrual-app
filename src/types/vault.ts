/**
 * Vault domain types. See docs/vault-v1.md for the full contract, including
 * the privacy rules every one of these types exists to enforce:
 *   - A Spark is owner-only by default. A partner never receives it merely
 *     because they're connected, a tease exists, or they reacted.
 *   - Tease content is a separate, explicitly-authored field — never
 *     derived from or exposing sparkContent.
 *   - Full disclosure requires the explicit two-sided reveal ceremony
 *     (SparkStatus "revealed"), never implied by a match alone.
 *   - Curiosity, a mutual match, or a past reaction are never treated as
 *     consent for anything beyond viewing that one already-revealed Spark.
 */

export type SparkHeatLevel = "warm" | "hot" | "bold";

export type SparkStatus =
  | "private"
  | "teased"
  | "waiting"
  | "ready_to_reveal"
  | "revealed"
  | "archived";

/** How the partner responded to a received tease. */
export type TeaseResponse = "curious" | "maybe_later" | "not_tonight" | "not_for_me";

/** Either party's reaction to a just-revealed Spark. */
export type RevealReaction = "love_this" | "curious" | "lets_talk_first" | "not_tonight" | "not_for_me";

/** Self-rating while answering a Desire Deck prompt — a private signal, not shared automatically. */
export type DeckInterestLevel = "into_this" | "curious" | "maybe_someday" | "not_for_me";

/** Solo/mutual post-Afterglow reflection reaction. */
export type AfterglowReaction = "loved_it" | "liked_it" | "not_sure" | "not_for_me";

export type VaultDeckId = "closer" | "desire" | "curiosity" | "slow_burn" | "give_receive" | "after_dark";

export interface VaultDeck {
  id: VaultDeckId;
  name: string;
  description: string;
}

/**
 * A Spark, as returned to its OWNER. Includes every field — this shape must
 * never be returned for a Spark the caller does not own.
 */
export interface VaultSpark {
  id: string;
  heatLevel: SparkHeatLevel;
  status: SparkStatus;
  /** The private, full content. Owner-only — never sent to a partner at any status. */
  content: string;
  /** Separate, explicitly-authored tease text. Null until a tease exists. */
  teaseText: string | null;
  deckId: VaultDeckId | null;
  /** The Desire Deck prompt this Spark answers, if it originated from a deck. */
  deckPromptId: string | null;
  partnerTeaseResponse: TeaseResponse | null;
  ownerReadyAt: string | null;
  partnerReadyAt: string | null;
  revealedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * What the CONNECTED PARTNER receives for a Spark that isn't theirs.
 * Deliberately a much narrower shape than VaultSpark — `content` never
 * appears here at all, at any status, so there is no field to forget to
 * omit. Only present once shared_with_partner-equivalent conditions hold:
 * a tease exists (teaseText populated) or the Spark is revealed (in which
 * case content is only obtainable via the separate reveal-scoped fetch,
 * never this summary shape).
 */
export interface VaultPartnerSparkSummary {
  id: string;
  heatLevel: SparkHeatLevel;
  status: SparkStatus;
  teaseText: string | null;
  ownerReadyAt: string | null;
  partnerReadyAt: string | null;
  revealedAt: string | null;
  createdAt: string;
}

/** The full revealed content, returned only once revealedAt is set for both the owner and the partner. */
export interface VaultRevealedSpark {
  id: string;
  heatLevel: SparkHeatLevel;
  content: string;
  revealedAt: string;
  ownerReaction: RevealReaction | null;
  partnerReaction: RevealReaction | null;
}

export interface VaultAfterglowReflection {
  id: string;
  sparkId: string;
  authorId: string;
  reaction: AfterglowReaction;
  note: string | null;
  createdAt: string;
}

export const VAULT_DECKS: VaultDeck[] = [
  { id: "closer", name: "Closer", description: "Nurturing deep emotional intimacy, safety, and mutual understanding." },
  { id: "desire", name: "Desire", description: "Wanting more of each other. Expressing intense cravings and longings." },
  { id: "curiosity", name: "Curiosity", description: "Shedding taboos to explore fresh boundaries, play, and dreams." },
  { id: "slow_burn", name: "Slow Burn", description: "The sweet torture of delay, sensory focus, and long anticipation." },
  { id: "give_receive", name: "Give & Receive", description: "Balancing active spoiling with surrendering control and receiving." },
  { id: "after_dark", name: "After Dark", description: "Daring steps, highly sensual prompts, and raw physical expression." },
];
