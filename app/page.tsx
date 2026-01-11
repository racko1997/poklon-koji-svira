"use client";

import Image from "next/image";
import { useMemo, useState, useEffect, useRef } from "react";
import {
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";

const BRAND = {
  name: "Magicni magnet",
  red: "#ff2d55",
  redDark: "#e11d48",
};

const PRODUCT = {
  title: "Personalizovani magnet sa vašom fotografijom",
  subtitle:
    "Izaberi fotografiju i pjesmu — mi personalizujemo, pripremimo i pošaljemo na adresu. Brzo, jednostavno i bez komplikovanja.",
  priceNow: 39.9,
  priceOld: 49.9,
  currency: "BAM",
  delivery: "Dostava poštom širom BiH",
};

type GalleryItem =
  | { type: "video"; src: string; poster?: string; alt: string }
  | { type: "image"; src: string; alt: string };

// Ako još nemaš video fajl, ostavi hero.mp4, samo će pokazati poster.
// Kad dodaš video u /public/hero.mp4 radiće.
const GALLERY: GalleryItem[] = [
  { type: "video", src: "/hero.mp4", poster: "/p1.jpg", alt: "Video proizvoda" },
  { type: "image", src: "/p1.jpg", alt: "Magnet — primjer 1" },
  { type: "image", src: "/p2.jpg", alt: "Magnet — primjer 2" },
];

function formatPrice(v: number) {
  return v.toFixed(2).replace(".", ",");
}

function useCountdown(hours = 1) {
  const [endAt] = useState(() => Date.now() + hours * 60 * 60 * 1000);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = Math.max(0, endAt - now);
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);

  return { h, m, s };
}

function useRevealOnScroll() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const items = Array.from(el.querySelectorAll("[data-reveal]"));

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("reveal-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 }
    );

    items.forEach((it) => io.observe(it));
    return () => io.disconnect();
  }, []);

  return ref;
}

export default function Page() {
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    song: "",
    message: "",
    note: "",
  });

  const { h, m, s } = useCountdown(1);

  const total = useMemo(() => PRODUCT.priceNow * qty, [qty]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const revealRef = useRevealOnScroll();

  function openOrder() {
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setTimeout(() => {
      setOrderId(null);
      setErrorMsg(null);
      setSubmitting(false);
      setImageFile(null);
      setImagePreview(null);
    }, 250);
  }

  async function submitOnlineOrder() {
    setErrorMsg(null);

    if (!form.name || !form.phone || !form.city || !form.address) {
      setErrorMsg("Popuni ime, telefon, grad i adresu.");
      return;
    }
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) {
      setErrorMsg("Unesi ispravan email (obavezno).");
      return;
    }
    if (!form.song) {
      setErrorMsg("Unesi pjesmu (naziv ili link) — obavezno.");
      return;
    }
    if (!imageFile) {
      setErrorMsg("Dodaj fotografiju (obavezno).");
      return;
    }

    setSubmitting(true);

    try {
      // ✅ šaljemo sve server-side endpointu (/api/order)
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("phone", form.phone);
      fd.append("email", form.email);
      fd.append("city", form.city);
      fd.append("address", form.address);
      fd.append("qty", String(qty));
      fd.append("song", form.song);
      fd.append("message", form.message || "");
      fd.append("note", form.note || "");
      fd.append("total", (PRODUCT.priceNow * qty).toFixed(2));
      fd.append("photo", imageFile);

      const res = await fetch("/api/order", {
        method: "POST",
        body: fd,
      });

      // ✅ “bulletproof” parsing: prvo tekst, pa JSON ako je JSON
      const contentType = res.headers.get("content-type") || "";
      const text = await res.text();

      if (!contentType.includes("application/json")) {
        setErrorMsg(
          `Server nije vratio JSON (status ${res.status}). ${
            text ? text.slice(0, 180) : ""
          }`
        );
        return;
      }

      const data = JSON.parse(text);

      if (!res.ok || !data?.ok) {
        setErrorMsg(data?.error || "Greška pri slanju narudžbe. Pokušaj ponovo.");
        return;
      }

      setOrderId(data.orderId || "OK");
    } catch (e: any) {
      setErrorMsg(e?.message || "Greška pri slanju narudžbe. Pokušaj ponovo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Animacije + reveal */}
      <style>{`
        @keyframes pksPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes pksShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-2px); }
          40% { transform: translateX(2px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
        }
        .ctaPulse { animation: pksPulse 1.35s ease-in-out infinite; }
        .ctaShakeOnce { animation: pksShake 0.45s ease-in-out 1; }

        [data-reveal]{
          opacity: 0;
          transform: translateY(10px);
          transition: opacity .55s ease, transform .55s ease;
        }
        .reveal-in{
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .cardHover{
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .cardHover:hover{
          transform: translateY(-2px);
          box-shadow: 0 16px 40px rgba(0,0,0,.08);
        }
      `}</style>

      {/* Announcement bar */}
      <div className="text-white" style={{ backgroundColor: BRAND.red }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock3 className="h-4 w-4" />
            <span className="font-semibold">-20% popust</span>
            <span className="opacity-90">dok traje akcija</span>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs">
            <span className="opacity-90">Ističe za:</span>
            <span className="font-semibold tabular-nums">
              {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:
              {String(s).padStart(2, "0")}
            </span>
          </div>

          <div className="hidden items-center gap-2 text-sm md:flex">
            <Truck className="h-4 w-4" />
            <span className="opacity-90">Dostava:</span>
            <span className="font-semibold">{PRODUCT.delivery}</span>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-neutral-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <Image
                src="/logo.png"
                alt={BRAND.name}
                fill
                className="object-contain p-1"
              />
            </div>
            <div className="leading-tight">
              <div className="font-semibold">{BRAND.name}</div>
              <div className="text-xs text-neutral-500">Online narudžba • BiH</div>
            </div>
          </div>

          {/* B-mode: sakrij CTA na mobilnom */}
          <button
            onClick={openOrder}
            className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm active:scale-[0.99] md:inline-flex"
            style={{ backgroundColor: BRAND.red }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = BRAND.redDark)
            }
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = BRAND.red)}
          >
            Naruči odmah
          </button>
        </div>
      </header>

      <main ref={revealRef} className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="grid items-start gap-10 md:grid-cols-2">
          {/* Gallery FIRST on mobile */}
          <div
            className="order-1 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm md:order-2 cardHover"
            data-reveal
          >
            <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
              {GALLERY[Math.min(activeImg, GALLERY.length - 1)]?.type === "video" ? (
                <video
                  className="h-full w-full object-cover"
                  controls
                  playsInline
                  poster={(GALLERY[activeImg] as any).poster}
                >
                  <source src={(GALLERY[activeImg] as any).src} type="video/mp4" />
                </video>
              ) : (
                <Image
                  src={
                    (GALLERY[Math.min(activeImg, GALLERY.length - 1)] as any)?.src ??
                    "/p1.jpg"
                  }
                  alt={
                    (GALLERY[Math.min(activeImg, GALLERY.length - 1)] as any)?.alt ??
                    "Proizvod"
                  }
                  fill
                  className="object-cover"
                  priority
                />
              )}

              {/* Mobile overlay CTA */}
              <div className="pointer-events-none absolute inset-x-3 bottom-3 md:hidden">
                <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border border-white/20 bg-black/35 px-3 py-2 backdrop-blur">
                  <div className="min-w-0">
                    <div className="text-xs text-white/80">Akcija -20%</div>
                    <div className="text-sm font-semibold text-white">
                      {formatPrice(PRODUCT.priceNow)} {PRODUCT.currency}
                    </div>
                  </div>
                  <button
                    onClick={openOrder}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm active:scale-[0.99]"
                    style={{ backgroundColor: BRAND.red }}
                  >
                    Naruči
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              {GALLERY.slice(0, 6).map((item, i) => (
                <button
                  key={item.src}
                  onClick={() => setActiveImg(i)}
                  className={`relative aspect-square overflow-hidden rounded-xl border ${
                    i === activeImg ? "border-neutral-900" : "border-neutral-200"
                  } bg-neutral-100`}
                >
                  {item.type === "video" ? (
                    <>
                      <Image
                        src={item.poster ?? "/p1.jpg"}
                        alt={item.alt}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 grid place-items-center bg-black/20">
                        <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold">
                          ▶ Video
                        </div>
                      </div>
                    </>
                  ) : (
                    <Image src={item.src} alt={item.alt} fill className="object-cover" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Left SECOND on mobile */}
          <div className="order-2 md:order-1" data-reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700">
              <ShieldCheck className="h-4 w-4" />
              Plaćanje pouzećem • Sigurna isporuka
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
              {PRODUCT.title}
            </h1>
            <p className="mt-4 text-base text-neutral-600 md:text-lg">
              {PRODUCT.subtitle}
            </p>

            {/* Benefits */}
            <div className="mt-6 grid gap-3">
              {[
                "Izaberi fotografiju (upload na sajtu)",
                "Unesi pjesmu (naziv ili link) — mi ubacujemo sve",
                `Dostava: ${PRODUCT.delivery}`,
              ].map((t) => (
                <div key={t} className="flex items-start gap-3">
                  <div
                    className="mt-0.5 rounded-lg p-1 text-white"
                    style={{ backgroundColor: BRAND.red }}
                  >
                    <Check className="h-4 w-4" />
                  </div>
                  <div className="text-sm text-neutral-700 md:text-base">{t}</div>
                </div>
              ))}
            </div>

            {/* Idealno za */}
            <div
              className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm cardHover"
              data-reveal
            >
              <div className="text-sm font-semibold">Idealno za:</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  "Godišnjica",
                  "Rođendan",
                  "Valentinovo",
                  "Poklon za nju/njega",
                  "Iznenađenje",
                ].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Price + CTA */}
            <div
              className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm cardHover"
              data-reveal
            >
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-sm text-neutral-500">Cijena</div>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-semibold">
                      {formatPrice(PRODUCT.priceNow)} {PRODUCT.currency}
                    </div>
                    <div className="text-sm text-neutral-400 line-through">
                      {formatPrice(PRODUCT.priceOld)} {PRODUCT.currency}
                    </div>
                    <span
                      className="rounded-full px-2 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: BRAND.red }}
                    >
                      -20%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-500">Količina</span>
                  <div className="flex items-center overflow-hidden rounded-xl border border-neutral-200">
                    <button
                      className="px-3 py-2 text-neutral-600 hover:bg-neutral-50"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                    >
                      −
                    </button>
                    <div className="w-10 text-center text-sm font-semibold tabular-nums">
                      {qty}
                    </div>
                    <button
                      className="px-3 py-2 text-neutral-600 hover:bg-neutral-50"
                      onClick={() => setQty((q) => Math.min(9, q + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={openOrder}
                  className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm active:scale-[0.99]"
                  style={{ backgroundColor: BRAND.red }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = BRAND.redDark)
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = BRAND.red)
                  }
                >
                  Naruči — {formatPrice(total)} {PRODUCT.currency}
                </button>
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-3">
                <TrustItem
                  icon={<Truck className="h-4 w-4" />}
                  title="Dostava"
                  desc={PRODUCT.delivery}
                />
                <TrustItem
                  icon={<CreditCard className="h-4 w-4" />}
                  title="Pouzeće"
                  desc="Plaćaš kuriru"
                />
                <TrustItem
                  icon={<Package className="h-4 w-4" />}
                  title="Pakovanje"
                  desc="Spremno za poklon"
                />
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <section className="mt-14" data-reveal>
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Kako radi (3 koraka)
            </h2>
            <div className="hidden text-sm text-neutral-500 md:block">
              Brzo, jasno, bez komplikovanja.
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <StepCard
              n="01"
              title="Izaberi fotografiju"
              desc="Ubaci sliku direktno u formi za narudžbu."
              brandRed={BRAND.red}
            />
            <StepCard
              n="02"
              title="Unesi pjesmu"
              desc="Upiši naziv pjesme ili zalijepi link (YouTube/Spotify)."
              brandRed={BRAND.red}
            />
            <StepCard
              n="03"
              title="Mi pripremimo i pošaljemo"
              desc="Personalizujemo, pripremimo i šaljemo na tvoju adresu."
              brandRed={BRAND.red}
            />
          </div>
        </section>

        {/* Benefits */}
        <section className="mt-14" data-reveal>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Zašto je ovo savršen poklon
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <FeatureCard
              title="Personalizovano po tvojoj želji"
              desc="Fotografija + pjesma = poklon koji postaje uspomena."
              brandRed={BRAND.red}
            />
            <FeatureCard
              title="Spremno za poklanjanje"
              desc="Mi sve pripremimo i uredno zapakujemo — ti samo naručiš."
              brandRed={BRAND.red}
            />
            <FeatureCard
              title="Jednostavna online narudžba"
              desc="Popuni formu, ubaci sliku i pošalji — potvrda stiže na email."
              brandRed={BRAND.red}
            />
            <FeatureCard
              title="Mi radimo sve umjesto tebe"
              desc="Ti pošalješ sliku i pjesmu, mi personalizujemo i šaljemo na adresu."
              brandRed={BRAND.red}
            />
          </div>
        </section>

        {/* Pricing */}
        <section className="mt-14" data-reveal>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Cijena & akcija
            </h2>
            <div className="text-sm text-neutral-500">
              Količinski popust za više komada (idealno za poklone).
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <PriceCard
              label="1 kom"
              price={PRODUCT.priceNow}
              note="Najprodavanije"
              onPick={() => {
                setQty(1);
                openOrder();
              }}
              brandRed={BRAND.red}
              brandRedDark={BRAND.redDark}
            />
            <PriceCard
              label="2 kom"
              price={Math.round(PRODUCT.priceNow * 2 * 0.9 * 100) / 100}
              note="-10% na drugi"
              onPick={() => {
                setQty(2);
                openOrder();
              }}
              brandRed={BRAND.red}
              brandRedDark={BRAND.redDark}
            />
            <PriceCard
              label="3 kom"
              price={Math.round(PRODUCT.priceNow * 3 * 0.85 * 100) / 100}
              note="-15% na set"
              onPick={() => {
                setQty(3);
                openOrder();
              }}
              brandRed={BRAND.red}
              brandRedDark={BRAND.redDark}
            />
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-14" data-reveal>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            FAQ
          </h2>
          <div className="mt-6 grid gap-3">
            <FaqItem
              q="Kako šaljem fotografiju?"
              a="Fotografiju ubaciš direktno u formi prilikom narudžbe (upload)."
            />
            <FaqItem
              q="Kako dodajem pjesmu?"
              a="Uneseš naziv pjesme ili link (YouTube/Spotify). Mi ubacujemo pjesmu."
            />
            <FaqItem q="Kako se plaća?" a="Pouzećem — plaćaš kuriru kad preuzmeš paket." />
            <FaqItem q="Da li dostavljate širom BiH?" a="Da — dostava ide poštom širom BiH." />
          </div>
        </section>

        {/* Footer */}
        <footer
          className="mt-14 border-t border-neutral-200 py-10 text-sm text-neutral-600"
          data-reveal
        >
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                <Image
                  src="/logo.png"
                  alt={BRAND.name}
                  fill
                  className="object-contain p-1"
                />
              </div>
              <div>
                <div className="font-semibold text-neutral-900">{BRAND.name}</div>
                <div className="text-neutral-500">
                  BiH • {PRODUCT.delivery} • Pouzeće
                </div>
              </div>
            </div>

            <button
              className="hidden items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold text-white hover:opacity-95 md:inline-flex"
              onClick={openOrder}
              style={{ backgroundColor: BRAND.red }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = BRAND.redDark)
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = BRAND.red)
              }
            >
              Naruči odmah
            </button>
          </div>
        </footer>
      </main>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                style={{ backgroundColor: BRAND.red }}
              >
                -20%
              </span>
              <div className="text-xs text-neutral-500">Akcijska cijena</div>
            </div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <div className="text-base font-semibold">
                {formatPrice(PRODUCT.priceNow)} {PRODUCT.currency}
              </div>
              <div className="text-xs text-neutral-400 line-through">
                {formatPrice(PRODUCT.priceOld)} {PRODUCT.currency}
              </div>
              <div className="ml-auto text-xs text-neutral-500">Pouzeće</div>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.currentTarget.classList.remove("ctaShakeOnce");
              void e.currentTarget.offsetWidth;
              e.currentTarget.classList.add("ctaShakeOnce");
              openOrder();
            }}
            className="ctaPulse rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm active:scale-[0.99]"
            style={{ backgroundColor: BRAND.red }}
          >
            Naruči
          </button>
        </div>
      </div>

      {/* ORDER DRAWER */}
      <div
        className={`fixed inset-0 z-50 ${drawerOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!drawerOpen}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            drawerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeDrawer}
        />

        <div
          className={`absolute right-0 top-0 h-full w-full max-w-lg transform bg-white shadow-2xl transition-transform ${
            drawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <div>
              <div className="text-sm text-neutral-500">Online narudžba</div>
              <div className="font-semibold">{PRODUCT.title}</div>
            </div>
            <button
              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
              onClick={closeDrawer}
            >
              Zatvori
            </button>
          </div>

          <div className="h-[calc(100%-72px)] overflow-y-auto px-5 py-5">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-600">Ukupno</div>
                <div className="text-lg font-semibold">
                  {formatPrice(total)} {PRODUCT.currency}
                </div>
              </div>
              <div className="mt-2 text-xs text-neutral-500">
                Plaćanje pouzećem • {PRODUCT.delivery}
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <Field
                label="Ime i prezime"
                value={form.name}
                onChange={(v) => setForm((p) => ({ ...p, name: v }))}
                placeholder="Npr. tvoje ime"
              />
              <Field
                label="Telefon"
                value={form.phone}
                onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
                placeholder="Npr. 066/..."
              />
              <Field
                label="Email (obavezno)"
                value={form.email}
                onChange={(v) => setForm((p) => ({ ...p, email: v }))}
                placeholder="npr. neko@gmail.com"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Grad"
                  value={form.city}
                  onChange={(v) => setForm((p) => ({ ...p, city: v }))}
                  placeholder="Gradiška"
                />
                <Field
                  label="Adresa"
                  value={form.address}
                  onChange={(v) => setForm((p) => ({ ...p, address: v }))}
                  placeholder="Ulica i broj"
                />
              </div>

              {/* Upload image (bulletproof) */}
              <label className="grid gap-2">
                <span className="text-sm font-semibold">Fotografija (obavezno)</span>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setImageFile(file);
                    e.currentTarget.value = "";
                  }}
                  className="block w-full cursor-pointer rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none"
                />

                {imageFile && (
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                    <div className="text-xs font-semibold text-neutral-700">
                      Odabrano: {imageFile.name}
                    </div>

                    {imagePreview && (
                      <div className="mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-44 w-full object-cover"
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setImageFile(null)}
                      className="mt-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-neutral-50"
                    >
                      Ukloni sliku
                    </button>
                  </div>
                )}

                <span className="text-xs text-neutral-500">
                  Preporuka: jasna fotografija, lice u fokusu (JPG/PNG/WEBP).
                </span>
              </label>

              <Field
                label="Pjesma (obavezno) — naziv ili link"
                value={form.song}
                onChange={(v) => setForm((p) => ({ ...p, song: v }))}
                placeholder="YouTube/Spotify link ili naziv"
              />

              <Field
                label="Poruka (opciono)"
                value={form.message}
                onChange={(v) => setForm((p) => ({ ...p, message: v }))}
                placeholder="Npr. Volim te ❤️"
              />

              <Field
                label="Napomena (opciono)"
                value={form.note}
                onChange={(v) => setForm((p) => ({ ...p, note: v }))}
                placeholder="Boja, posebna želja..."
              />

              {errorMsg && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {errorMsg}
                </div>
              )}

              {orderId ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                  <div className="text-sm font-semibold text-green-800">
                    Narudžba uspješno poslata ✅
                  </div>
                  <div className="mt-1 text-sm text-green-700">
                    Broj narudžbe:{" "}
                    <span className="font-semibold">{orderId}</span>
                  </div>
                  <div className="mt-2 text-xs text-green-700/80">
                    Potvrda je poslata na email (ako ne vidiš, provjeri Spam).
                  </div>
                </div>
              ) : (
                <button
                  onClick={submitOnlineOrder}
                  disabled={submitting}
                  className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-white shadow-sm disabled:opacity-60 active:scale-[0.99]"
                  style={{ backgroundColor: BRAND.red }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = BRAND.redDark)
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = BRAND.red)
                  }
                >
                  {submitting ? "Šaljem..." : "Pošalji online narudžbu"}
                </button>
              )}

              <div className="text-xs text-neutral-500">
                * Plaćanje pouzećem. Dostava poštom širom BiH.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* padding for mobile sticky */}
      <div className="h-24 md:hidden" />
    </div>
  );
}

/* ---------- UI Bits ---------- */

function TrustItem({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-3">
      <div className="rounded-lg bg-neutral-900 p-2 text-white">{icon}</div>
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-neutral-500">{desc}</div>
      </div>
    </div>
  );
}

function StepCard({
  n,
  title,
  desc,
  brandRed,
}: {
  n: string;
  title: string;
  desc: string;
  brandRed: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm cardHover" data-reveal>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-neutral-500">KORAK</div>
        <div
          className="rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{ backgroundColor: brandRed }}
        >
          {n}
        </div>
      </div>
      <div className="mt-3 text-lg font-semibold">{title}</div>
      <div className="mt-2 text-sm text-neutral-600">{desc}</div>
    </div>
  );
}

function FeatureCard({
  title,
  desc,
  brandRed,
}: {
  title: string;
  desc: string;
  brandRed: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm cardHover" data-reveal>
      <div className="flex items-start gap-3">
        <div className="rounded-xl p-2 text-white" style={{ backgroundColor: brandRed }}>
          <Check className="h-5 w-5" />
        </div>
        <div>
          <div className="text-base font-semibold">{title}</div>
          <div className="mt-1 text-sm text-neutral-600">{desc}</div>
        </div>
      </div>
    </div>
  );
}

function PriceCard({
  label,
  price,
  note,
  onPick,
  brandRed,
  brandRedDark,
}: {
  label: string;
  price: number;
  note: string;
  onPick: () => void;
  brandRed: string;
  brandRedDark: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm cardHover" data-reveal>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-neutral-500">{label}</div>
          <div className="mt-1 text-2xl font-semibold">
            {formatPrice(price)} {PRODUCT.currency}
          </div>
        </div>
        <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
          {note}
        </span>
      </div>

      <button
        onClick={onPick}
        className="mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm active:scale-[0.99]"
        style={{ backgroundColor: brandRed }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = brandRedDark)}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = brandRed)}
      >
        Izaberi paket
      </button>

      <div className="mt-4 text-xs text-neutral-500">
        Pouzeće • {PRODUCT.delivery}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-semibold">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-900"
      />
    </label>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm cardHover" data-reveal>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="font-semibold">{q}</div>
        <ChevronDown
          className={`h-5 w-5 text-neutral-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && <div className="px-5 pb-5 text-sm text-neutral-600">{a}</div>}
    </div>
  );
}
