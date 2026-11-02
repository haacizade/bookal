import type { CSSProperties } from "react";
import Link from "next/link";
import type { ListingCard as Card } from "@/lib/listings";
import type { Copy } from "@/lib/copy";
import { WishlistButton } from "./WishlistButton";

/** Genre slug -> the colour family of the original Bookal design (see home.css `.card[data-cat=…]`). */
const CAT: Record<string, string> = { textbook: "textbook", fiction: "fiction", science: "science", language_learning: "language", history: "history", business: "business", children: "children" };
export const catOf = (genre: string) => CAT[genre] ?? "other";

export function ListingCard({ item, t, index, canWishlist = false, wishlistLabels }: {
  item: Card; t: Copy["home"]; index: number; canWishlist?: boolean; wishlistLabels?: Pick<Copy["wishlist"], "add" | "remove">;
}) {
  const price = item.type === "EXCHANGE" ? t.exchange : item.price > 0 ? `${item.price} ${t.currency}` : t.free;
  const genreLabel = (t.genres as Record<string, string>)[item.genre] ?? item.genre;
  const university = item.seller.university;

  return (
    <div className="card" data-cat={catOf(item.genre)} style={{ "--k": index } as CSSProperties}>
      {canWishlist && wishlistLabels && (
        <WishlistButton listingId={item.id} initial={item.isWishlisted} addLabel={wishlistLabels.add} removeLabel={wishlistLabels.remove} />
      )}
      <Link href={`/listings/${item.id}`} className="cover" aria-label={item.title}>
        {item.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.coverUrl} alt="" loading="lazy" />
        ) : (
          <span>{item.title}</span>
        )}
      </Link>
      <h3 className="card-title"><Link href={`/listings/${item.id}`}>{item.title}</Link></h3>
      <div className="meta">{item.author}</div>
      <div className="meta">{university ? `${university} • ` : ""}{t.conditions[item.condition]}</div>
      <div className="row-between">
        <span className="price">{price}</span>
        <span className="badge">{genreLabel}</span>
      </div>
      <div className="seller-phone">
        {item.seller.phone ? <a href={`tel:${item.seller.phone}`}>{item.seller.phone}</a> : <span>{t.contactLogin}</span>}
      </div>
    </div>
  );
}
