import Link from "next/link";
import { notFound } from "next/navigation";
import { getCopy } from "@/lib/copy";
import { getViewer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site/SiteHeader";
import { WishlistButton } from "@/components/catalog/WishlistButton";
import "@/app/profile.css";
import "@/app/wishlist.css";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t, viewer] = await Promise.all([params, getCopy(), getViewer()]);
  const listing = await prisma.listing.findFirst({
    where: { id, status: "ACTIVE" },
    select: {
      id: true, title: true, author: true, description: true, language: true, condition: true,
      type: true, price: true, coverUrl: true, pdfUrl: true,
      genre: { select: { slug: true } },
      seller: { select: { name: true, phone: true, university: true } },
    },
  });
  if (!listing) notFound();
  const activeViewer = viewer && !viewer.isSuspended ? viewer : null;
  const [wishlistItem, isVip] = activeViewer ? await Promise.all([
    prisma.wishlistItem.findUnique({ where: { userId_listingId: { userId: activeViewer.id, listingId: id } }, select: { listingId: true } }),
    prisma.user.findUnique({ where: { id: activeViewer.id }, select: { isVip: true, vipExpiresAt: true } }),
  ]) : [null, null];
  const activeVip = !!isVip?.isVip && !!isVip.vipExpiresAt && isVip.vipExpiresAt > new Date();
  const genreLabel = (t.home.genres as Record<string, string>)[listing.genre.slug] ?? listing.genre.slug;
  const price = listing.type === "EXCHANGE" ? t.home.exchange : listing.price.toNumber() > 0 ? `${listing.price.toString()} ${t.home.currency}` : t.home.free;

  return (
    <div className="bk">
      <SiteHeader t={t} viewer={viewer} active="home" />
      <main className="wrap bk-grow listing-detail">
        <Link href="/#elanlar" className="back-link">← {t.listing.back}</Link>
        <article className="detail-layout">
          <div className="detail-cover">
            {listing.coverUrl ? <img src={listing.coverUrl} alt={listing.title} /> : <span>{listing.title}</span>}
          </div>
          <div className="detail-content">
            <div className="detail-overline">{genreLabel} · {t.home.conditions[listing.condition]}</div>
            <h1>{listing.title}</h1>
            <p className="detail-author">{t.home.authorLabel}: {listing.author}</p>
            <p className="detail-price">{price}</p>
            {listing.description && <section className="detail-description"><h2>{t.home.descriptionLabel}</h2><p>{listing.description}</p></section>}
            {listing.pdfUrl && (activeViewer && activeVip
              ? <a className="btn btn-mustard" href={listing.pdfUrl} target="_blank" rel="noreferrer">{t.home.pdfDownload}</a>
              : <p className="pf-hint">{t.home.pdfRequiresVip} <Link href="/dashboard">{t.profile.vipTitle}</Link></p>)}
            <div className="detail-seller"><strong>{listing.seller.name}</strong>{listing.seller.university && <span>{listing.seller.university}</span>}
              {activeViewer && listing.seller.phone ? <a href={`tel:${listing.seller.phone}`}>{listing.seller.phone}</a> : <Link href={viewer?.isSuspended ? "/suspended" : "/login"}>{t.home.contactLogin}</Link>}
            </div>
            {activeViewer && <WishlistButton listingId={listing.id} initial={!!wishlistItem} addLabel={t.wishlist.add} removeLabel={t.wishlist.remove} />}
          </div>
        </article>
      </main>
      <footer className="bk-footer">{t.home.footer}</footer>
    </div>
  );
}