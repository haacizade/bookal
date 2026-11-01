import { leaveReviewAction } from "@/actions/transactions";
import { readJson, toResponse } from "@/lib/api";

export async function POST(req: Request) {
  return toResponse(await leaveReviewAction(await readJson(req)));
}
