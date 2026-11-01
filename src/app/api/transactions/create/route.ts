import { createTransactionAction } from "@/actions/transactions";
import { readJson, toResponse } from "@/lib/api";

export async function POST(req: Request) {
  const { listingId } = await readJson(req);
  return toResponse(await createTransactionAction(listingId));
}
