import { toggleWishlistAction } from "@/actions/wishlist";
import { readJson, toResponse } from "@/lib/api";

export async function POST(req: Request) {
  const { listingId } = await readJson(req);
  return toResponse(await toggleWishlistAction(listingId));
}
