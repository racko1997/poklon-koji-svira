import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function safeString(v: FormDataEntryValue | null) {
  if (!v) return "";
  return typeof v === "string" ? v.trim() : "";
}

function isValidEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

// ✅ Lijep broj narudžbe za email (ne mijenjamo DB id)
function prettyOrderCode(orderId: string) {
  return `MAG-${orderId.slice(0, 8).toUpperCase()}`;
}

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
    const SERVICE_ROLE = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const RESEND_API_KEY = requiredEnv("RESEND_API_KEY");
    const ADMIN_EMAIL = requiredEnv("ADMIN_EMAIL");
    const FROM_EMAIL = requiredEnv("FROM_EMAIL");

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    const resend = new Resend(RESEND_API_KEY);

    const fd = await req.formData();

    // Fields
    const name = safeString(fd.get("name"));
    const phone = safeString(fd.get("phone"));
    const email = safeString(fd.get("email"));
    const city = safeString(fd.get("city"));
    const address = safeString(fd.get("address"));
    const song = safeString(fd.get("song"));
    const message = safeString(fd.get("message"));
    const note = safeString(fd.get("note"));

    const qtyStr = safeString(fd.get("qty"));
    const totalStr = safeString(fd.get("total"));

    const qty = Math.max(1, Math.min(9, Number(qtyStr || 1)));
    const total = Number(totalStr || 0);

    // Photo
    const photo = fd.get("photo");
    if (!(photo instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Dodaj fotografiju (obavezno)." },
        { status: 400 }
      );
    }

    if (!name || !phone || !email || !city || !address || !song) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Popuni obavezna polja (ime, telefon, email, grad, adresa, pjesma).",
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Unesi ispravan email." },
        { status: 400 }
      );
    }

    // 1) Upload to storage
    const extRaw = photo.name.split(".").pop()?.toLowerCase() || "jpg";
    const ext = ["jpg", "jpeg", "png", "webp"].includes(extRaw) ? extRaw : "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
    const filePath = `images/${fileName}`;

    const arrayBuffer = await photo.arrayBuffer();
    const { error: upErr } = await supabase.storage
      .from("orders")
      .upload(filePath, new Uint8Array(arrayBuffer), {
        contentType: photo.type || "image/jpeg",
        upsert: false,
        cacheControl: "3600",
      });

    if (upErr) {
      return NextResponse.json(
        { ok: false, error: `Upload greška: ${upErr.message}` },
        { status: 500 }
      );
    }

    const { data: pub } = supabase.storage.from("orders").getPublicUrl(filePath);
    const imageUrl = pub.publicUrl;

    // 2) Insert into DB
    const { data: inserted, error: insErr } = await supabase
      .from("orders")
      .insert([
        {
          name,
          phone,
          email,
          city,
          address,
          qty,
          song,
          message: message || null,
          note: note || null,
          image_url: imageUrl,
          status: "new",
        },
      ])
      .select("id")
      .single();

    if (insErr) {
      return NextResponse.json(
        { ok: false, error: `DB greška: ${insErr.message}` },
        { status: 500 }
      );
    }

    const orderId = inserted.id as string;
    const orderCode = prettyOrderCode(orderId);

    // 3) Email kupcu (KRATKO)
    let customerEmailSent = false;
    let customerEmailError: string | null = null;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [email],
        subject: `Potvrda narudžbe ${orderCode} — Magicni magnet`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5">
            <h2 style="margin:0 0 8px">Hvala! Narudžba je zaprimljena ✅</h2>

            <p style="margin:0 0 10px">
              Broj narudžbe: <b>${orderCode}</b>
            </p>

            <p style="margin:0 0 8px">Količina: <b>${qty}</b></p>
            <p style="margin:0 0 12px">
              Ukupno: <b>${Number.isFinite(total) && total > 0 ? total.toFixed(2) : ""} BAM</b>
            </p>

            <p style="margin:0 0 12px">
              Plaćanje pouzećem. Dostava poštom širom BiH.
            </p>

            <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
            <p style="margin:0;color:#666;font-size:12px">
              Ako imaš pitanja, odgovori na ovaj email: magicnimagnet@gmail.com
            </p>
          </div>
        `,
      });
      customerEmailSent = true;
    } catch (e: any) {
      customerEmailError =
        e?.message || "Email kupcu nije poslat (Resend error).";
    }

    // 4) Email adminu (SVE)
    let adminEmailSent = false;
    let adminEmailError: string | null = null;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject: `NOVA NARUDŽBA ${orderCode} — Magicni magnet`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5">
            <h2 style="margin:0 0 12px">Nova narudžba ✅</h2>

            <p style="margin:0 0 6px"><b>Broj (za kupca):</b> ${orderCode}</p>
            <p style="margin:0 0 6px"><b>Order ID (DB):</b> ${orderId}</p>

            <hr style="border:none;border-top:1px solid #eee;margin:12px 0" />

            <p style="margin:0 0 6px"><b>Ime:</b> ${name}</p>
            <p style="margin:0 0 6px"><b>Telefon:</b> ${phone}</p>
            <p style="margin:0 0 6px"><b>Email kupca:</b> ${email}</p>
            <p style="margin:0 0 6px"><b>Grad:</b> ${city}</p>
            <p style="margin:0 0 6px"><b>Adresa:</b> ${address}</p>
            <p style="margin:0 0 6px"><b>Količina:</b> ${qty}</p>
            <p style="margin:0 0 10px"><b>Ukupno:</b> ${
              Number.isFinite(total) && total > 0 ? total.toFixed(2) : ""
            } BAM</p>

            <hr style="border:none;border-top:1px solid #eee;margin:12px 0" />

            <p style="margin:0 0 6px"><b>Pjesma:</b> ${song}</p>
            <p style="margin:0 0 6px"><b>Poruka:</b> ${message || "-"}</p>
            <p style="margin:0 0 12px"><b>Napomena:</b> ${note || "-"}</p>

            <p style="margin:0 0 8px"><b>Fotografija:</b></p>
            <p style="margin:0 0 12px">
              <a href="${imageUrl}" target="_blank" rel="noreferrer">${imageUrl}</a>
            </p>
            <img src="${imageUrl}" alt="Foto" style="max-width:480px;width:100%;border-radius:12px;border:1px solid #eee" />
          </div>
        `,
      });
      adminEmailSent = true;
    } catch (e: any) {
      adminEmailError =
        e?.message || "Admin email nije poslat (Resend error).";
    }

    // ✅ uvijek vrati OK jer je narudžba upisana
    return NextResponse.json({
      ok: true,
      orderId,
      orderCode,
      imageUrl,
      customerEmailSent,
      customerEmailError,
      adminEmailSent,
      adminEmailError,
      adminEmailTo: ADMIN_EMAIL,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
