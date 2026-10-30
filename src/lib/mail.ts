import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const url = `${process.env.APP_URL}/verify-email?token=${encodeURIComponent(token)}`;

  if (!resend) {
    console.log(`\n[mail:dev] verification link for ${to}\n${url}\n`);
    return;
  }
  const { error } = await resend.emails.send({
    from: process.env.MAIL_FROM!,
    to,
    subject: "Bookal — e-poçtunu təsdiqlə",
    html: `<p>Salam, ${esc(name)}!</p>
           <p>Hesabını aktiv etmək üçün e-poçtunu təsdiqlə. Link 24 saat etibarlıdır.</p>
           <p><a href="${url}" style="background:#16215B;color:#fff;padding:12px 20px;border-radius:100px;text-decoration:none;font-weight:700">E-poçtu təsdiqlə</a></p>
           <p style="color:#565C7A;font-size:13px">Bu sorğunu sən göndərməmisənsə, bu məktubu nəzərə alma.</p>`,
  });
  if (error) throw new Error(`Resend failed: ${error.message}`);
}
