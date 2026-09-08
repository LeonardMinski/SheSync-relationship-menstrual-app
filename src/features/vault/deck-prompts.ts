import type { VaultDeckId } from "@/types/vault";

export interface DeckPrompt {
  id: string;
  text: string;
}

/**
 * Static prompt bank for each Desire Deck. The approved Figma design shows
 * one example prompt per deck (Curiosity's is used verbatim below); the
 * rest extend that same register and tone. Not DB-backed — same treatment
 * as add-a-spark's starter prompts, since these are app-provided content,
 * not user data.
 */
export const DECK_PROMPTS: Record<VaultDeckId, DeckPrompt[]> = {
  closer: [
    { id: "closer-1", text: "A way I'd love for us to feel more emotionally close this week is..." },
    { id: "closer-2", text: "Something I need to feel safe being fully open with you is..." },
    { id: "closer-3", text: "A moment I felt closest to you recently was..." },
  ],
  desire: [
    { id: "desire-1", text: "Something I've been craving more of between us lately is..." },
    { id: "desire-2", text: "A small thing you do that makes me want you is..." },
    { id: "desire-3", text: "If I could ask for one thing more often, it would be..." },
  ],
  curiosity: [
    { id: "curiosity-1", text: "Something new I've wondered about us trying, but haven't found the right words to say is..." },
    { id: "curiosity-2", text: "A boundary I've been curious about gently exploring is..." },
    { id: "curiosity-3", text: "Something I've seen or read that made me curious about us is..." },
  ],
  slow_burn: [
    { id: "slow_burn-1", text: "A way I'd love for us to draw out anticipation before we're together is..." },
    { id: "slow_burn-2", text: "Something that makes waiting feel exciting instead of frustrating is..." },
    { id: "slow_burn-3", text: "A slow, unhurried evening I'd love us to have is..." },
  ],
  give_receive: [
    { id: "give_receive-1", text: "Something I'd love to give you, with nothing expected back, is..." },
    { id: "give_receive-2", text: "Something I'd love to receive from you, if I let myself ask, is..." },
    { id: "give_receive-3", text: "A way I could make you feel spoiled this week is..." },
  ],
  after_dark: [
    { id: "after_dark-1", text: "Something bolder I've thought about but haven't said out loud is..." },
    { id: "after_dark-2", text: "A raw, honest desire I'd want to explore together is..." },
    { id: "after_dark-3", text: "A step outside our usual routine I'd be curious to take is..." },
  ],
};
