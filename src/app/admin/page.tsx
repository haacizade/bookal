import { getCopy } from "@/lib/copy";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site/SiteHeader";
import { reviewListingAction, reviewVipRequestAction, setUserSuspendedAction } from "@/actions/admin";
import "@/app/profile.css";
import "./admin.css";

export default async function AdminPage() {
  const admin = await requireAdmin();
  const [t, users, pendingListings, activeListings, transactions, vipRequests] = await Promise.all([
    getCopy(),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { id: true, name: true, email: true, role: true, isSuspended: true, isVip: true, vipExpiresAt: true } }),
    prisma.listing.findMany({ where: { status: "PENDING_APPROVAL" }, orderBy: { createdAt: "asc" }, take: 50, select: { id: true, title: true, author: true, price: true, type: true, createdAt: true, seller: { select: { name: true, email: true } } } }),
    prisma.listing.findMany({ where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, title: true, author: true, createdAt: true, seller: { select: { name: true } } } }),
    prisma.transaction.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { id: true, status: true, type: true, price: true, createdAt: true, listing: { select: { title: true } }, buyer: { select: { name: true, email: true } }, seller: { select: { name: true, email: true } } } }),
    prisma.vipRequest.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, take: 50, select: { id: true, createdAt: true, user: { select: { name: true, email: true } } } }),
  ]);
  const a = t.admin;
  const viewer = { id: admin.id, name: "Admin", avatarUrl: null, isVip: admin.isVip, role: admin.role };

  return (
    <div className="bk">
      <SiteHeader t={t} viewer={viewer} active="admin" />
      <main className="wrap admin-page bk-grow">
        <h1>{a.title}</h1>

        <section className="admin-section">
          <h2>{a.pendingListings} <span>{pendingListings.length}</span></h2>
          {pendingListings.length === 0 ? <p>{a.empty}</p> : <div className="admin-list">
            {pendingListings.map((listing) => <article className="admin-row" key={listing.id}>
              <div><strong>{listing.title}</strong><p>{listing.author} · {listing.seller.name} · {listing.seller.email}</p><small>{listing.type === "EXCHANGE" ? t.home.exchange : `${listing.price.toString()} AZN`} · {listing.createdAt.toLocaleDateString(t.locale)}</small></div>
              <div className="admin-actions">
                <form action={reviewListingAction}><input type="hidden" name="listingId" value={listing.id} /><input type="hidden" name="status" value="ACTIVE" /><button className="btn btn-primary">{a.approve}</button></form>
                <form action={reviewListingAction}><input type="hidden" name="listingId" value={listing.id} /><input type="hidden" name="status" value="ARCHIVED" /><button className="btn btn-ghost">{a.reject}</button></form>
              </div>
            </article>)}
          </div>}
        </section>

        <section className="admin-section">
          <h2>{a.listings}</h2>
          {activeListings.length === 0 ? <p>{a.empty}</p> : <div className="admin-list">
            {activeListings.map((listing) => <article className="admin-row" key={listing.id}>
              <div><strong>{listing.title}</strong><p>{listing.author} · {listing.seller.name}</p><small>{listing.createdAt.toLocaleDateString(t.locale)}</small></div>
              <form action={reviewListingAction}><input type="hidden" name="listingId" value={listing.id} /><input type="hidden" name="status" value="ARCHIVED" /><button className="btn btn-ghost">{a.delete}</button></form>
            </article>)}
          </div>}
        </section>

        <section className="admin-section">
          <h2>{a.vipRequests} <span>{vipRequests.length}</span></h2>
          {vipRequests.length === 0 ? <p>{a.empty}</p> : <div className="admin-list">
            {vipRequests.map((request) => <article className="admin-row" key={request.id}>
              <div><strong>{request.user.name}</strong><p>{request.user.email} · {request.createdAt.toLocaleDateString(t.locale)}</p></div>
              <div className="admin-actions">
                <form action={reviewVipRequestAction}><input type="hidden" name="requestId" value={request.id} /><input type="hidden" name="decision" value="APPROVED" /><button className="btn btn-primary">{a.approve}</button></form>
                <form action={reviewVipRequestAction}><input type="hidden" name="requestId" value={request.id} /><input type="hidden" name="decision" value="REJECTED" /><button className="btn btn-ghost">{a.reject}</button></form>
              </div>
            </article>)}
          </div>}
        </section>

        <section className="admin-section">
          <h2>{a.users} <span>{users.length}</span></h2>
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{a.users}</th><th>{a.email}</th><th>{a.role}</th><th>{a.status}</th><th /></tr></thead><tbody>
            {users.map((user) => <tr key={user.id}><td>{user.name}{user.isVip && user.vipExpiresAt && user.vipExpiresAt > new Date() && <span className="vip-badge">VIP</span>}</td><td>{user.email}</td><td>{user.role}</td><td>{user.isSuspended ? a.suspend : a.activeStatus}</td><td>{user.role === "USER" && <form action={setUserSuspendedAction}><input type="hidden" name="userId" value={user.id} /><input type="hidden" name="suspend" value={String(!user.isSuspended)} /><button className="btn btn-ghost btn-sm">{user.isSuspended ? a.restore : a.suspend}</button></form>}</td></tr>)}
          </tbody></table></div>
        </section>

        <section className="admin-section">
          <h2>{a.transactions} <span>{transactions.length}</span></h2>
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{a.listings}</th><th>{a.seller}</th><th>{a.buyer}</th><th>{a.price}</th><th>{a.status}</th><th>{a.date}</th></tr></thead><tbody>
            {transactions.map((transaction) => <tr key={transaction.id}><td>{transaction.listing.title}</td><td>{transaction.seller.name}<small>{transaction.seller.email}</small></td><td>{transaction.buyer.name}<small>{transaction.buyer.email}</small></td><td>{transaction.price.toString()} AZN</td><td>{transaction.status}</td><td>{transaction.createdAt.toLocaleDateString(t.locale)}</td></tr>)}
          </tbody></table></div>
        </section>
      </main>
      <footer className="bk-footer">{t.home.footer}</footer>
    </div>
  );
}