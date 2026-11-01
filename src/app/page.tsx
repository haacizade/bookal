import Link from "next/link";
import { getCopy } from "@/lib/copy";
import { getViewer } from "@/lib/session";
import { GUEST_LISTING_LIMIT } from "@/lib/guest";
import { queryListings } from "@/lib/listings";
import { parseListingFilters } from "@/lib/listing-params";
import { ListingCard } from "@/components/catalog/ListingCard";
import { GuestLock } from "@/components/catalog/GuestLock";
import { Shelf } from "@/components/catalog/Shelf";
import { SiteHeader } from "@/components/site/SiteHeader";

const CHIPS = ["all", "textbook", "fiction", "science", "language_learning", "other"] as const;

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [t, viewer, sp] = await Promise.all([getCopy(), getViewer(), searchParams]);
  const viewerId = viewer?.id ?? null;
  const h = t.home;

  // Guests always get the same fixed preview: the newest N listings, no search / filters / paging.
  const filters = viewerId ? parseListingFilters(sp) : { ...parseListingFilters({}), pageSize: GUEST_LISTING_LIMIT };
  const data = await queryListings(filters, viewerId);
  const hidden = viewerId ? 0 : Math.max(0, data.total - data.items.length);

  const q = filters.q ?? "";
  const activeGenre = filters.genre[0] ?? "all";
  const href = (page: number) => {
    const params = new URLSearchParams({ page: String(page) });
    if (q) params.set("q", q);
    if (filters.genre[0]) params.set("genre", filters.genre[0]);
    return `/?${params}#elanlar`;
  };
  const chipHref = (c: string) => {
    const target = c === "all" ? "/" : `/?genre=${c}`;
    return viewerId ? `${target}#elanlar` : `/login?next=${encodeURIComponent(target)}`;
  };

  return (
    <div className="bk">
      <SiteHeader t={t} viewer={viewer} active="home" />

      <div className="bk-grow">
        <section className="hero">
          <div className="wrap">
            <h1>{h.heroTitle}</h1>
            <p>{h.heroSub}</p>
            <div className="hero-ctas">
              <a href="#elanlar" className="btn btn-mustard">{h.browse}</a>
              <Link href={viewer ? "/dashboard" : "/register"} className="btn btn-ghost">{h.post}</Link>
            </div>
            {/* Guests can't search: submitting sends them to the login page, then back here. */}
            <form className="searchbar" action={viewer ? "/" : "/login"} role="search">
              {!viewer && <input type="hidden" name="next" value="/" />}
              <input type="text" name="q" defaultValue={q} placeholder={h.searchPh} aria-label={h.searchPh}
                autoComplete="off" enterKeyHint="search" />
            </form>
            <div className="chips">
              {CHIPS.map((c) => (
                <Link key={c} href={chipHref(c)} className={`chip${c === activeGenre ? " active" : ""}`}>{h.genres[c]}</Link>
              ))}
            </div>
          </div>
          <Shelf />
        </section>

        <main className="wrap bk-main" id="elanlar" style={{ scrollMarginTop: 70 }}>
          <div className="grid-head">
            <h2>{h.listingsTitle}</h2>
            <span className="count">{data.total}{h.countSuffix}</span>
          </div>

          {data.items.length === 0 ? (
            <div className="empty">{h.empty}</div>
          ) : (
            <div className="grid">
              {data.items.map((item, i) => <ListingCard key={item.id} item={item} t={h} index={i} />)}
            </div>
          )}

          {!viewerId && data.items.length > 0 && <GuestLock t={h} hidden={hidden} />}

          {viewerId && data.totalPages > 1 && (
            <nav className="pager" aria-label="pagination">
              {data.page > 1 && <Link href={href(data.page - 1)} className="btn btn-ghost">{h.prev}</Link>}
              <span>{h.page.replace("{p}", String(data.page)).replace("{n}", String(data.totalPages))}</span>
              {data.page < data.totalPages && <Link href={href(data.page + 1)} className="btn btn-ghost">{h.next}</Link>}
            </nav>
          )}
        </main>

        <section className="wrap how">
          <h2>{h.howTitle}</h2>
          <ol className="how-list">
            {h.steps.map((s, i) => <li key={i}><span className="n">{i + 1}</span><p>{s}</p></li>)}
          </ol>
        </section>

        <section className="why">
          <div className="wrap">
            <h2>{h.whyTitle}</h2>
            <p>{h.whyText}</p>
          </div>
        </section>
      </div>

      <footer className="bk-footer">{h.footer}</footer>
    </div>
  );
}
