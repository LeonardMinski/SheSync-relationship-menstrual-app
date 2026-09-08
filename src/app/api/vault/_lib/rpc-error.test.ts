import { beforeEach, describe, expect, it, vi } from "vitest";

import { vaultRpcErrorResponse } from "./rpc-error";

describe("vaultRpcErrorResponse", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("maps 'not authenticated' to 401", async () => {
    const response = vaultRpcErrorResponse("test", "do this", { message: "not authenticated" });
    expect(response.status).toBe(401);
  });

  it("maps 'not found' to 404", async () => {
    const response = vaultRpcErrorResponse("test", "do this", { message: "spark not found" });
    expect(response.status).toBe(404);
  });

  it.each([
    "not the owner of this spark",
    "not the active partner of this spark's owner",
    "not a participant in this spark's reveal",
    "no active partner relationship to share with",
    "relationship is no longer active",
  ])("maps ownership/participation guard '%s' to 403", async (message) => {
    const response = vaultRpcErrorResponse("test", "do this", { message });
    expect(response.status).toBe(403);
  });

  it.each(["invalid response", "invalid reaction", "tease text is required"])(
    "maps validation guard '%s' to 400",
    async (message) => {
      const response = vaultRpcErrorResponse("test", "do this", { message });
      expect(response.status).toBe(400);
    },
  );

  it.each([
    "a tease can only be created from a private spark",
    "this spark cannot be shared directly from its current status",
    "this spark is not awaiting a tease response",
    "this spark is not in the reveal ceremony",
    "both participants must be ready before revealing",
    "this spark has not been revealed yet",
    "this spark has not been revealed",
  ])("maps state-machine guard '%s' to 409", async (message) => {
    const response = vaultRpcErrorResponse("test", "do this", { message });
    expect(response.status).toBe(409);
  });

  it("returns a safe generic 500 on an unmapped error, never the raw DB error text", async () => {
    const response = vaultRpcErrorResponse("test", "do this", { message: "connection reset by peer" });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).not.toContain("connection reset by peer");
  });

  it("exposes the specific guard message for a recognized error, not a generic one", async () => {
    const response = vaultRpcErrorResponse("test", "do this", { message: "spark not found" });
    const body = await response.json();
    expect(body.error).toBe("spark not found");
  });
});
