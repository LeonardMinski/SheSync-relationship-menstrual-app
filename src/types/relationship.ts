export type SupportContext = "overwhelmed" | "upset" | "difficult_period_day";

export type SupportChoice =
  | "space_first"
  | "reassure"
  | "help_practically"
  | "ask_what_i_need"
  | "physical_affection"
  | "quiet_company";

export type SupportBarrier = "advice_problem_solving" | "crowding" | "telling_to_relax";

export interface SupportPreference {
  id: string;
  context: SupportContext;
  preferredSupports: SupportChoice[];
  whatDoesNotHelp: SupportBarrier[];
  additionalContext: string | null;
  isShared: boolean;
  sharedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** What a viewer receives for a support preference their partner shared with them. */
export interface SharedSupportPreference {
  ownerName: string;
  context: SupportContext;
  preferredSupports: SupportChoice[];
  whatDoesNotHelp: SupportBarrier[];
  additionalContext: string | null;
  sharedAt: string;
}

export type PartnerContextStatus = "draft" | "shared" | "revoked";

export type TranslationHelpChoice =
  | "space"
  | "quiet_company"
  | "practical_help"
  | "reassurance"
  | "physical_affection";

export type TranslationExclusionChoice = "advice" | "questions_about_it" | "trying_to_fix_it";

export interface PartnerContext {
  id: string;
  whatTheyShouldKnow: string;
  mightHelp: TranslationHelpChoice[];
  dontNeed: TranslationExclusionChoice[];
  status: PartnerContextStatus;
  sharedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** What a viewer receives for a translation their partner shared with them. */
export interface SharedPartnerContext {
  ownerName: string;
  whatTheyShouldKnow: string;
  mightHelp: TranslationHelpChoice[];
  dontNeed: TranslationExclusionChoice[];
  sharedAt: string;
}

export interface Appreciation {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  sentAt: string;
  direction: "sent" | "received";
}

export type SessionType = "weekly_us" | "mutual_reveal" | "repair";
export type RevealCategory =
  | "affection"
  | "future"
  | "communication"
  | "quality_time"
  | "intimacy"
  | "support";

export interface SessionPrompt {
  key: string;
  text: string;
}

export interface RelationshipSession {
  id: string;
  sessionType: SessionType;
  category: RevealCategory | null;
  prompts: SessionPrompt[];
  isInitiator: boolean;
  ownReadyAt: string | null;
  partnerReadyAt: string | null;
  revealedAt: string | null;
  createdAt: string;
}

export interface SessionAnswer {
  answererId: string;
  promptKey: string;
  answerText: string;
}

export type RelationshipMemorySourceType =
  | "support_preference"
  | "weekly_us"
  | "mutual_reveal"
  | "repair"
  | "appreciation"
  | "partner_context";

export interface RelationshipMemory {
  id: string;
  createdBy: string;
  sourceType: RelationshipMemorySourceType;
  sourceId: string;
  title: string;
  content: string;
  createdAt: string;
}

export type ReplySourceType = "partner_context" | "appreciation" | "relationship_session" | "vault_spark";

export interface SharedReply {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}
