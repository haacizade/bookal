import type { CSSProperties } from "react";
import type { ListingCard as Card } from "@/lib/listings";
import type { Copy } from "@/lib/copy";

/** Genre slug -> the colour family of the original Bookal design (see home.css `.card[data-cat=…]`). */
const CAT: Record<string, string> = { textbook: "textbook", fiction: "fiction", science: "science", language_learning: "language" };
export const catOf = (genre: string) => CAT[genre] ?? "other";

export function ListingCard({ item, t, index }: { item: Card; t: Copy["home"]; index: number }) {
  const price = item.type === "EXCHANGE" ? t.exchange : item.price > 0 ? `${item.price} ${t.currency}` : t.free;
  const genreLabel = (t.genres as Record<string, string>)[item.genre] ?? item.genre;
  const university = item.seller.university;

  return (
    <div className="card" data-cat={catOf(item.genre)} style={{ "--k": index } as CSSProperties}>
      <div className="cover" aria-hidden="true">
        {item.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.coverUrl} alt="" loading="lazy" />
        ) : (
          <span>{item.title}</span>
        )}
      </div>
      <h3 className="sr">{item.title}</h3>
      <div className="meta">{item.author}</div>
      <div className="meta">{university ? `${university} • ` : ""}{t.conditions[item.condition]}</div>
      <div className="row-between">
        <span className="price">{price}</span>
        <span className="badge">{genreLabel}</span>
      </div>
    </div>
  );
}
