import { createErrorResponse } from "@/lib/api/responses";

/**
 * Every Vault RPC (see database/vault-v1-migration.sql) raises from the
 * same small, fixed vocabulary of guard messages — mirroring
 * relationship-sessions' per-route statusForSessionRpcError, but shared
 * here since ~9 Vault routes all call one of these same RPCs.
 */
function classifyVaultRpcError(message: string): { status: number; expose: boolean } {
  if (message.includes("not authenticated")) return { status: 401, expose: true };
  if (message.includes("not found")) return { status: 404, expose: true };
  if (
    message.includes("not the owner") ||
    message.includes("not the active partner") ||
    message.includes("not a participant") ||
    message.includes("no active partner") ||
    message.includes("no longer active")
  ) {
    return { status: 403, expose: true };
  }
  if (
    message.includes("invalid response") ||
    message.includes("invalid reaction") ||
    message.includes("tease text is required")
  ) {
    return { status: 400, expose: true };
  }
  if (
    message.includes("can only") ||
    message.includes("cannot") ||
    message.includes("not awaiting") ||
    message.includes("not in the reveal ceremony") ||
    message.includes("must be ready") ||
    message.includes("has not been revealed")
  ) {
    return { status: 409, expose: true };
  }
  return { status: 500, expose: false };
}

export function vaultRpcErrorResponse(routeName: string, action: string, error: { message: string }) {
  console.error(`[${routeName}] ${action} failed`, error);
  const { status, expose } = classifyVaultRpcError(error.message);
  return createErrorResponse(expose ? error.message : `Unable to ${action}. Please try again.`, status);
}
