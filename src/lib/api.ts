import { NextResponse } from "next/server";

/** Body of a JSON request, or `{}` when it is missing / malformed (the actions validate the rest). */
export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await req.json();
    return typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

const STATUS: Record<string, number> = {
  VALIDATION: 400, UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404,
  OWN_LISTING: 409, LISTING_UNAVAILABLE: 409, ALREADY_REQUESTED: 409, NOT_PENDING: 409,
  NOT_COMPLETED: 409, ALREADY_REVIEWED: 409, GENERIC: 500,
};

/** Server Action result -> JSON response with a matching HTTP status. */
export function toResponse(result: { ok: boolean; code?: string }) {
  return NextResponse.json(result, { status: result.ok ? 200 : (STATUS[result.code ?? "GENERIC"] ?? 400) });
}
