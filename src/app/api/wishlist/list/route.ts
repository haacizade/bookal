import { fetchWishlistAction } from "@/actions/wishlist";
import { toResponse } from "@/lib/api";

export async function GET(req: Request) {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  return toResponse(await fetchWishlistAction(params));
}
