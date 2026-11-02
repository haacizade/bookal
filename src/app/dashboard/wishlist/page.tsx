import Link from "next/link";
import { redirect } from "next/navigation";
import { getCopy } from "@/lib/copy";
import { getViewer, requireUser } from "@/lib/session";
import { parsePagination } from "@/lib/listing-params";
import { queryWishlist } from "@/lib/wishlist";
import { ListingCard } from "@/components/catalog/ListingCard";
import { SiteHeader } from "@/components/site/SiteHeader";
import "@/app/wishlist.css";

export default async function WishlistPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireUser();
  const [t, viewer, sp] = await Promise.all([getCopy(), getViewer(), searchParams]);
  if (!viewer) redirect("/login");

  const data = await queryWishlist(session.id, parsePagination(sp));
  const h = t.home;
  const w = t.wishlist;
  const href = (page: number) => `/dashboard/wishlist?page=${page}`;

  return (
    <div className="bk">
      <SiteHeader t={t} viewer={viewer} active="wishlist" />

      <main className="wrap bk-main bk-grow" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <Link href="/" className="back-link">← {t.profile.back}</Link>
        <div className="grid-head">
          <h2>{w.title}</h2>
          <span className="count">{data.total}{w.countSuffix}</span>
        </div>
        <p className="profile-sub" style={{ marginTop: -8 }}>{w.sub}</p>

        {data.items.length === 0 ? (
          <div className="empty">
            <p>{w.empty}</p>
            <Link href="/#elanlar" className="btn btn-mustard">{w.browse}</Link>
          </div>
        ) : (
          <div className="grid">
            {data.items.map((it, i) => (
              <div key={it.listing.id} className="wl-item" data-status={it.status}>
                {it.status === "RESERVED" && <span className="wl-tag">{w.reserved}</span>}
                {it.status === "COMPLETED" && <span className="wl-tag">{w.sold}</span>}
                <ListingCard item={it.listing} t={h} index={i} canWishlist wishlistLabels={w} />
              </div>
            ))}
          </div>
        )}

        {data.totalPages > 1 && (
          <nav className="pager" aria-label="pagination">
            {data.page > 1 && <Link href={href(data.page - 1)} className="btn btn-ghost">{h.prev}</Link>}
            <span>{h.page.replace("{p}", String(data.page)).replace("{n}", String(data.totalPages))}</span>
            {data.page < data.totalPages && <Link href={href(data.page + 1)} className="btn btn-ghost">{h.next}</Link>}
          </nav>
        )}
      </main>

      <footer className="bk-footer">{h.footer}</footer>
    </div>
  );
}
