import type { CSSProperties } from "react";
import Link from "next/link";
import { catOf } from "./ListingCard";

export type ShelfItem = { slug: string; label: string; href: string };

// Decorative hero shelf. Every spine is a real category (same list as the filter chips), shelved
// in tidy, upright pairs; clicking a spine opens that category.
const HEIGHTS = [184, 212, 168];

export function Shelf({ items }: { items: ShelfItem[] }) {
  const spines = items.flatMap((item, g) => [0, 1].map((n) => ({ item, n, h: HEIGHTS[(g + n) % HEIGHTS.length] })));
  return (
    <nav className="shelf" aria-label="Categories">
      {spines.map(({ item, n, h }, i) => (
        <Link
          key={`${item.slug}-${n}`}
          href={item.href}
          className={`sp${n ? " dup" : ""}`}
          data-cat={catOf(item.slug)}
          title={item.label}
          {...(n ? { "aria-hidden": true, tabIndex: -1 } : {})}
          style={{ "--w": "38px", "--h": `${h}px`, "--i": i } as CSSProperties}
        >
          <b>{item.label}</b>
        </Link>
      ))}
    </nav>
  );
}
