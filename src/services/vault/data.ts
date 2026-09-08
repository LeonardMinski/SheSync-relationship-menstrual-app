import { supabase } from "@/lib/supabase/client";
import type {
  AfterglowReaction,
  DeckInterestLevel,
  RevealReaction,
  SparkHeatLevel,
  TeaseResponse,
  VaultAfterglowReflection,
  VaultDeckId,
  VaultPartnerSparkSummary,
  VaultRevealedSpark,
  VaultSpark,
} from "@/types/vault";

export interface DeckPromptMatch {
  sparkId: string;
  deckId: VaultDeckId;
  deckPromptId: string;
  heatLevel: SparkHeatLevel;
  matchedAt: string;
}

async function authorizedFetch(path: string, init: RequestInit = {}) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("[vault] failed to read Supabase session", sessionError);
    throw new Error("Authentication required");
  }

  if (!session?.access_token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...(init.headers ?? {}),
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || "Request failed");
  }

  return body.data;
}

function toSpark(row: Record<string, unknown>): VaultSpark {
  return {
    id: row.id as string,
    heatLevel: row.heat_level as SparkHeatLevel,
    status: row.status as VaultSpark["status"],
    content: row.content as string,
    teaseText: (row.tease_text as string | null) ?? null,
    deckId: (row.deck_id as VaultSpark["deckId"]) ?? null,
    deckPromptId: (row.deck_prompt_id as string | null) ?? null,
    partnerTeaseResponse: (row.partner_tease_response as TeaseResponse | null) ?? null,
    ownerReadyAt: (row.owner_ready_at as string | null) ?? null,
    partnerReadyAt: (row.partner_ready_at as string | null) ?? null,
    revealedAt: (row.revealed_at as string | null) ?? null,
    archivedAt: (row.archived_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function listSparks(status?: VaultSpark["status"]): Promise<VaultSpark[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const data = await authorizedFetch(`/api/vault/sparks${query}`, { method: "GET" });
  return ((data?.sparks ?? []) as Record<string, unknown>[]).map(toSpark);
}

export async function getSpark(id: string): Promise<VaultSpark> {
  const data = await authorizedFetch(`/api/vault/sparks/${id}`, { method: "GET" });
  return toSpark(data);
}

export async function createSpark(input: {
  heatLevel: SparkHeatLevel;
  content: string;
  deckId?: VaultSpark["deckId"];
  deckPromptId?: string | null;
  deckInterestLevel?: DeckInterestLevel | null;
}): Promise<VaultSpark> {
  const data = await authorizedFetch("/api/vault/sparks", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return toSpark(data);
}

export async function updateSpark(id: string, input: { heatLevel?: SparkHeatLevel; content?: string }): Promise<VaultSpark> {
  const data = await authorizedFetch(`/api/vault/sparks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return toSpark(data);
}

export async function deleteSpark(id: string): Promise<void> {
  await authorizedFetch(`/api/vault/sparks/${id}`, { method: "DELETE" });
}

export async function archiveSpark(id: string): Promise<VaultSpark> {
  const data = await authorizedFetch(`/api/vault/sparks/${id}/archive`, { method: "POST" });
  return toSpark(data);
}

export async function createTease(id: string, teaseText: string): Promise<void> {
  await authorizedFetch(`/api/vault/sparks/${id}/tease`, {
    method: "POST",
    body: JSON.stringify({ teaseText }),
  });
}

export async function shareSparkDirectly(id: string): Promise<void> {
  await authorizedFetch(`/api/vault/sparks/${id}/share-directly`, { method: "POST" });
}

export async function respondToTease(id: string, response: TeaseResponse): Promise<void> {
  await authorizedFetch(`/api/vault/sparks/${id}/tease-response`, {
    method: "POST",
    body: JSON.stringify({ response }),
  });
}

export async function markSparkReady(id: string): Promise<void> {
  await authorizedFetch(`/api/vault/sparks/${id}/ready`, { method: "POST" });
}

export async function revealSparkTogether(id: string): Promise<void> {
  await authorizedFetch(`/api/vault/sparks/${id}/reveal`, { method: "POST" });
}

export async function getRevealedSpark(id: string): Promise<VaultRevealedSpark> {
  const data = await authorizedFetch(`/api/vault/sparks/${id}/revealed`, { method: "GET" });
  return {
    id: data.id,
    heatLevel: data.heat_level,
    content: data.content,
    revealedAt: data.revealed_at,
    ownerReaction: data.owner_reaction ?? null,
    partnerReaction: data.partner_reaction ?? null,
  };
}

export async function reactToRevealedSpark(id: string, reaction: RevealReaction): Promise<void> {
  await authorizedFetch(`/api/vault/sparks/${id}/reaction`, {
    method: "POST",
    body: JSON.stringify({ reaction }),
  });
}

export async function getAfterglowReflections(id: string): Promise<VaultAfterglowReflection[]> {
  const data = await authorizedFetch(`/api/vault/sparks/${id}/afterglow`, { method: "GET" });
  return ((data?.reflections ?? []) as Record<string, unknown>[]).map((row) => ({
    id: `${id}:${row.author_id}`,
    sparkId: id,
    authorId: row.author_id as string,
    reaction: row.reaction as AfterglowReaction,
    note: (row.note as string | null) ?? null,
    createdAt: row.created_at as string,
  }));
}

export async function saveAfterglowReflection(
  id: string,
  input: { reaction: AfterglowReaction; note?: string | null },
): Promise<void> {
  await authorizedFetch(`/api/vault/sparks/${id}/afterglow`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getPartnerVaultSummary(): Promise<VaultPartnerSparkSummary[]> {
  const data = await authorizedFetch("/api/vault/partner", { method: "GET" });
  return ((data?.sparks ?? []) as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    heatLevel: row.heat_level as SparkHeatLevel,
    status: row.status as VaultPartnerSparkSummary["status"],
    teaseText: (row.tease_text as string | null) ?? null,
    ownerReadyAt: (row.owner_ready_at as string | null) ?? null,
    partnerReadyAt: (row.partner_ready_at as string | null) ?? null,
    revealedAt: (row.revealed_at as string | null) ?? null,
    createdAt: row.created_at as string,
  }));
}

export async function getForTonightMatches(): Promise<DeckPromptMatch[]> {
  const data = await authorizedFetch("/api/vault/for-tonight", { method: "GET" });
  return ((data?.matches ?? []) as Record<string, unknown>[]).map((row) => ({
    sparkId: row.spark_id as string,
    deckId: row.deck_id as VaultDeckId,
    deckPromptId: row.deck_prompt_id as string,
    heatLevel: row.heat_level as SparkHeatLevel,
    matchedAt: row.matched_at as string,
  }));
}
