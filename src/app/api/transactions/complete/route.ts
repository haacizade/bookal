import { completeTransactionAction } from "@/actions/transactions";
import { readJson, toResponse } from "@/lib/api";

export async function POST(req: Request) {
  const { transactionId } = await readJson(req);
  return toResponse(await completeTransactionAction(transactionId));
}
