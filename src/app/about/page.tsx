import Link from "next/link";
import { getCopy } from "@/lib/copy";
import { getViewer } from "@/lib/session";
import { SiteHeader } from "@/components/site/SiteHeader";
import "@/app/wishlist.css";

export const metadata = { title: "Bookal" };

export default async function AboutPage() {
  const [t, viewer] = await Promise.all([getCopy(), getViewer()]);
  const a = t.about;

  return (
    <div className="bk">
      <SiteHeader t={t} viewer={viewer} active="about" />

      <main className="wrap about bk-grow" style={{ paddingTop: 40 }}>
        <h1>{a.title}</h1>
        <p className="about-sub">{a.sub}</p>

        <h2>{a.missionTitle}</h2>
        <p className="about-mission">{a.missionText}</p>

        <h2>{a.valuesTitle}</h2>
        <ul className="about-values">
          {a.values.map((v) => (
            <li key={v.title}><h3>{v.title}</h3><p>{v.text}</p></li>
          ))}
        </ul>

        <section className="about-info">
          <h2>{a.rulesTitle}</h2>
          <ul>{a.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
        </section>

        <section className="about-info">
          <h2>{a.guideTitle}</h2>
          <ol>{a.guide.map((step) => <li key={step}>{step}</li>)}</ol>
        </section>

        <section className="about-cta">
          <h2>{a.ctaTitle}</h2>
          <p>{a.ctaText}</p>
          <Link href={viewer?.isSuspended ? "/suspended" : viewer ? "/#elanlar" : "/register"} className="btn btn-mustard">
            {viewer && !viewer.isSuspended ? a.ctaMember : a.ctaGuest}
          </Link>
        </section>
      </main>

      <footer className="bk-footer">{t.home.footer}</footer>
    </div>
  );
}
