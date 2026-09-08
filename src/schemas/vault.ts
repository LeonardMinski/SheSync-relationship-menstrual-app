import { z } from "zod";

export const SparkHeatLevelSchema = z.enum(["warm", "hot", "bold"]);
export const VaultDeckIdSchema = z.enum(["closer", "desire", "curiosity", "slow_burn", "give_receive", "after_dark"]);
export const DeckInterestLevelSchema = z.enum(["into_this", "curious", "maybe_someday", "not_for_me"]);
export const TeaseResponseSchema = z.enum(["curious", "maybe_later", "not_tonight", "not_for_me"]);
export const RevealReactionSchema = z.enum(["love_this", "curious", "lets_talk_first", "not_tonight", "not_for_me"]);
export const AfterglowReactionSchema = z.enum(["loved_it", "liked_it", "not_sure", "not_for_me"]);

// Client never supplies user_id or status — the server always derives
// identity from the session, and every Spark starts private.
export const CreateVaultSparkInputSchema = z
  .object({
    heatLevel: SparkHeatLevelSchema,
    content: z.string().trim().min(1, "A Spark needs some content").max(4000),
    deckId: VaultDeckIdSchema.nullable().optional(),
    deckPromptId: z.string().trim().min(1).max(200).nullable().optional(),
    deckInterestLevel: DeckInterestLevelSchema.nullable().optional(),
  })
  .strict();

export const UpdateVaultSparkInputSchema = z
  .object({
    heatLevel: SparkHeatLevelSchema.optional(),
    content: z.string().trim().min(1).max(4000).optional(),
  })
  .strict();

export const CreateVaultTeaseInputSchema = z
  .object({
    teaseText: z.string().trim().min(1, "A tease needs some text").max(500),
  })
  .strict();

export const TeaseResponseInputSchema = z
  .object({
    response: TeaseResponseSchema,
  })
  .strict();

export const RevealReactionInputSchema = z
  .object({
    reaction: RevealReactionSchema,
  })
  .strict();

export const AfterglowReflectionInputSchema = z
  .object({
    reaction: AfterglowReactionSchema,
    note: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();

export type CreateVaultSparkInputParsed = z.infer<typeof CreateVaultSparkInputSchema>;
export type UpdateVaultSparkInputParsed = z.infer<typeof UpdateVaultSparkInputSchema>;
export type CreateVaultTeaseInputParsed = z.infer<typeof CreateVaultTeaseInputSchema>;
export type TeaseResponseInputParsed = z.infer<typeof TeaseResponseInputSchema>;
export type RevealReactionInputParsed = z.infer<typeof RevealReactionInputSchema>;
export type AfterglowReflectionInputParsed = z.infer<typeof AfterglowReflectionInputSchema>;
