import Link from "next/link";
import { getCopy } from "@/lib/copy";
import { getViewer, requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ListingForm } from "@/components/catalog/ListingForm";
import "@/app/profile.css";

export default async function NewListingPage() {
  await requireUser();
  const [t, viewer, genres, subjects] = await Promise.all([
    getCopy(),
    getViewer(),
    prisma.genre.findMany({ orderBy: [{ sortOrder: "asc" }, { slug: "asc" }], select: { id: true, slug: true } }),
    prisma.subject.findMany({ orderBy: [{ sortOrder: "asc" }, { slug: "asc" }], select: { id: true, slug: true } }),
  ]);
  const user = await prisma.user.findFirst({ where: { id: viewer?.id, isSuspended: false }, select: { phone: true } });
  const l = t.listing;

  return (
    <div className="bk">
      <SiteHeader t={t} viewer={viewer} active="new-listing" />
      <main className="wrap profile bk-grow">
        <Link href="/" className="back-link">← {l.back}</Link>
        <h1>{l.title}</h1>
        <p className="profile-sub">{l.sub}</p>
        <ListingForm t={l} errors={t.errors} fields={t.fields} genres={genres} subjects={subjects} genreLabels={t.home.genres} initialPhone={user?.phone ?? ""} />
      </main>
      <footer className="bk-footer">{t.home.footer}</footer>
    </div>
  );
}