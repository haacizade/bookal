import type { ActionFail, ErrorCode } from "@/actions/types";

/** Throw inside a `prisma.$transaction` callback: everything rolls back and `guarded` turns it into a typed result. */
export class Fail extends Error {
  constructor(readonly code: ErrorCode) {
    super(code);
  }
}

export const fail = (code: ErrorCode, fields?: string[]): ActionFail =>
  fields ? { ok: false, code, fields } : { ok: false, code };

/** Runs `run`; a thrown `Fail` becomes its code, anything unexpected is logged and becomes GENERIC. */
export async function guarded<T>(name: string, run: () => Promise<T>): Promise<T | ActionFail> {
  try {
    return await run();
  } catch (e) {
    if (e instanceof Fail) return fail(e.code);
    console.error(`[${name}]`, e);
    return fail("GENERIC");
  }
}
