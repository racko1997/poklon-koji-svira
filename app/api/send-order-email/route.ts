import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const from = process.env.FROM_EMAIL || "Magicni magnet <onboarding@resend.dev>";
    const admin = process.env.ADMIN_EMAIL || "stefanracanovic@gmail.com";

    // 1) Email tebi (admin)
    await resend.emails.send({
      from,
      to: [admin],
      subject: `Nova narudžba: ${data.orderId || "—"}`,
      html: `<pre style="font-family: ui-monospace; white-space: pre-wrap;">${JSON.stringify(data, null, 2)}</pre>`,
    });

    // 2) Email kupcu (ako postoji email)
    if (data.customerEmail) {
      await resend.emails.send({
        from,
        to: [data.customerEmail],
        subject: `Potvrda narudžbe — Magicni magnet`,
        html: `<p>Hvala na narudžbi! Vaš broj narudžbe je <b>${data.orderId || "—"}</b>.</p>`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}
