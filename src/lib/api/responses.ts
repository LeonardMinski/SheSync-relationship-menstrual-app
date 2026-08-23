import { NextResponse } from "next/server";

export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function createSuccessResponse(data: unknown, message?: string) {
  return NextResponse.json({
    data,
    message: message || "Success",
    success: true,
  });
}
