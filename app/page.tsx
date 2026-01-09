"use client";

import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import {
  Check,
  ChevronDown,
  Clock3,
  Copy,
  CreditCard,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Truck,
} from "lucide-react";

const BRAND = {
  name: "Poklon koji svira",
  phoneE164: "+38766168704", // tvoj broj (BiH)
  viberNumber: "38766168704", // bez +
  whatsappNumber: "38766168704", // bez +
  accent: "from-red-500 to-rose-500",
};

const PRODUCT = {
  title: "Personalizovani zvučnik sa vašom fotografijom",
  subtitle:
    "Poklon koji izgleda brutalno, a još bolje zvuči — ubaci sliku, dodaj pjesmu i spremno je za poklanjanje.",
  priceNow: 39.9,
  priceOld: 49.9,
  currency: "BAM",
  delivery: "1–2 dana (BiH)",
};

const GALLERY = [
  { src: "/p1.jpg", alt: "Zvučnik — prednja strana" },
  { src: "/p2.jpg", alt: "Zvučnik — zadnja strana" },
  { src: "/p3.jpg", alt: "Zvučnik — detalj" },
];

function formatPrice(v: number) {
  // 39.9 -> "39,90"
  return v.toFixed(2).replace(".", ",");
}

function buildOrderText(data: {
  name: string;
  phone: string;
  city: string;
  address: string;
  note: string;
  qty: number;
  message: string;
  song: string;
}) {
  const lines = [
    `Narudžba: ${PRODUCT.title}`,
    `Količina: ${data.qty}`,
    "",
    `Ime: ${data.name}`,
    `Telefon: ${data.phone}`,
    `Grad: ${data.city}`,
    `Adresa: ${data.address}`,
    "",
    data.message ? `Poruka (opciono): ${data.message}` : "",
    data.song ? `Pjesma/Link: ${data.song}` : "",
    data.note ? `Napomena: ${data.note}` : "",
    "",
    `Plaćanje: pouzećem`,
    `Dostava: ${PRODUCT.delivery}`,
  ].filter(Boolean);

  return lines.join("\n");
}

function makeWhatsAppLink(text: string) {
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${BRAND.whatsappNumber}?text=${encoded}`;
}

function makeViberLink(text: string) {
  const encoded = encodeURIComponent(text);
  // radi na uređajima sa Viberom; u browseru je fallback copy
  return `viber://forward?text=${encoded}`;
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

  return { h, m, s, done: diff === 0 };
}

export default function Page() {
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    address: "",
    message: "",
    song: "",
    note: "",
  });

  const { h, m, s } = useCountdown(1);

  const total = useMemo(() => PRODUCT.priceNow * qty, [qty]);

  const orderText = useMemo(
    () =>
      buildOrderText({
        ...form,
        qty,
      }),
    [form, qty]
  );

  const waLink = useMemo(() => makeWhatsAppLink(orderText), [orderText]);
  const viberLink = useMemo(() => makeViberLink(orderText), [orderText]);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(orderText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Announcement bar */}
      <div className={`bg-gradient-to-r ${BRAND.accent} text-white`}>
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
            <span className="opacity-90">Brza dostava:</span>
            <span className="font-semibold">{PRODUCT.delivery}</span>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-neutral-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <Image src="/logo.png" alt={BRAND.name} fill className="object-contain p-1" />
            </div>
            <div className="leading-tight">
              <div className="font-semibold">{BRAND.name}</div>
              <div className="text-xs text-neutral-500">One-page shop • BiH</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 active:scale-[0.99]"
            >
              Naruči odmah
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="grid items-start gap-10 md:grid-cols-2">
          {/* Left */}
          <div>
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
                "Personalizacija fotografijom (tvoja slika / vaša uspomena)",
                "Jednostavno prebacivanje pjesme (USB/telefon — uputstvo uključeno)",
                `Brza dostava po BiH: ${PRODUCT.delivery}`,
              ].map((t) => (
                <div key={t} className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-neutral-900 p-1 text-white">
                    <Check className="h-4 w-4" />
                  </div>
                  <div className="text-sm text-neutral-700 md:text-base">{t}</div>
                </div>
              ))}
            </div>

            {/* Price + CTA */}
            <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
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
                    <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">
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
                      aria-label="Smanji"
                    >
                      −
                    </button>
                    <div className="w-10 text-center text-sm font-semibold tabular-nums">
                      {qty}
                    </div>
                    <button
                      className="px-3 py-2 text-neutral-600 hover:bg-neutral-50"
                      onClick={() => setQty((q) => Math.min(9, q + 1))}
                      aria-label="Povećaj"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className={`rounded-xl bg-gradient-to-r ${BRAND.accent} px-4 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95 active:scale-[0.99]`}
                >
                  Naruči — {formatPrice(total)} {PRODUCT.currency}
                </button>
                <a
                  href={`tel:${BRAND.phoneE164}`}
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
                >
                  Pozovi: {BRAND.phoneE164}
                </a>
              </div>

              {/* Trust row */}
              <div className="mt-4 grid gap-2 md:grid-cols-3">
                <TrustItem icon={<Truck className="h-4 w-4" />} title="Brza dostava" desc={PRODUCT.delivery} />
                <TrustItem icon={<CreditCard className="h-4 w-4" />} title="Pouzeće" desc="Plaćaš kuriru" />
                <TrustItem icon={<Package className="h-4 w-4" />} title="Pakovanje" desc="Spremno za poklon" />
              </div>
            </div>
          </div>

          {/* Right: Gallery */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
              <Image
                src={GALLERY[Math.min(activeImg, GALLERY.length - 1)]?.src ?? "/p1.jpg"}
                alt={GALLERY[Math.min(activeImg, GALLERY.length - 1)]?.alt ?? "Proizvod"}
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              {GALLERY.slice(0, 6).map((img, i) => (
                <button
                  key={img.src}
                  onClick={() => setActiveImg(i)}
                  className={`relative aspect-square overflow-hidden rounded-xl border ${
                    i === activeImg ? "border-neutral-900" : "border-neutral-200"
                  } bg-neutral-100`}
                  aria-label={`Slika ${i + 1}`}
                >
                  <Image src={img.src} alt={img.alt} fill className="object-cover" />
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-white p-2">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold">Idealno za:</div>
                  <div className="mt-1 text-neutral-600">
                    godišnjice, rođendane, Valentinovo, poklon “bez greške” kad ne znaš šta kupiti.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <section className="mt-14">
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
              title="Pošalješ fotografiju"
              desc="Odabereš sliku koju želiš na zvučniku (par, porodica, prijatelji)."
            />
            <StepCard
              n="02"
              title="Dodaš pjesmu ili poruku"
              desc="Može link, naziv pjesme ili kratka poruka (opciono)."
            />
            <StepCard
              n="03"
              title="Mi pravimo i šaljemo"
              desc={`Pakujemo kao poklon i šaljemo na tvoju adresu — ${PRODUCT.delivery}.`}
            />
          </div>
        </section>

        {/* Features */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Zašto ovo prodaje brutalno dobro
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <FeatureCard
              title="Personalizacija = emocija"
              desc="Ljudi ne pamte cijenu — pamte osjećaj. Ovo je poklon koji ima priču."
            />
            <FeatureCard
              title="Spremno za poklon"
              desc="Ne razmišljaš o pakovanju i detaljima — samo naručiš i dobiješ gotovo."
            />
            <FeatureCard
              title="BiH-friendly kupovina"
              desc="Pouzeće + brza dostava. Nema komplikacija sa online plaćanjem."
            />
            <FeatureCard
              title="Jednostavno korišćenje"
              desc="Uputstvo uključeno. Pjesma se ubacuje brzo (USB/telefon)."
            />
          </div>
        </section>

        {/* Pricing */}
        <section className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Cijena & akcija</h2>
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
                setDrawerOpen(true);
              }}
            />
            <PriceCard
              label="2 kom"
              price={Math.round(PRODUCT.priceNow * 2 * 0.9 * 100) / 100}
              note="-10% na drugi"
              onPick={() => {
                setQty(2);
                setDrawerOpen(true);
              }}
            />
            <PriceCard
              label="3 kom"
              price={Math.round(PRODUCT.priceNow * 3 * 0.85 * 100) / 100}
              note="-15% na set"
              onPick={() => {
                setQty(3);
                setDrawerOpen(true);
              }}
            />
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">FAQ</h2>
          <div className="mt-6 grid gap-3">
            <FaqItem
              q="Kako šaljem fotografiju?"
              a="Nakon klika na Naruči, možeš poslati podatke putem Vibera/WhatsAppa. Fotografiju pošalješ u toj poruci."
            />
            <FaqItem
              q="Kako dodajem pjesmu?"
              a="Možeš poslati link ili naziv pjesme. Uputstvo za ubacivanje dobijaš uz proizvod."
            />
            <FaqItem
              q="Koliko traje dostava u BiH?"
              a={`U prosjeku ${PRODUCT.delivery}.`}
            />
            <FaqItem
              q="Kako se plaća?"
              a="Pouzećem — plaćaš kuriru kad preuzmeš paket."
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-14 border-t border-neutral-200 py-10 text-sm text-neutral-600">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                <Image src="/logo.png" alt={BRAND.name} fill className="object-contain p-1" />
              </div>
              <div>
                <div className="font-semibold text-neutral-900">{BRAND.name}</div>
                <div className="text-neutral-500">BiH • {PRODUCT.delivery} • Pouzeće</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 hover:bg-neutral-50"
                href={`tel:${BRAND.phoneE164}`}
              >
                <Phone className="h-4 w-4" /> Pozovi
              </a>
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-3 py-2 font-semibold text-white hover:bg-neutral-800"
                onClick={() => setDrawerOpen(true)}
              >
                Naruči odmah
              </button>
            </div>
          </div>
        </footer>
      </main>

      {/* ORDER DRAWER */}
      <div
        className={`fixed inset-0 z-50 ${drawerOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!drawerOpen}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            drawerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setDrawerOpen(false)}
        />

        <div
          className={`absolute right-0 top-0 h-full w-full max-w-lg transform bg-white shadow-2xl transition-transform ${
            drawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <div>
              <div className="text-sm text-neutral-500">Narudžba</div>
              <div className="font-semibold">{PRODUCT.title}</div>
            </div>
            <button
              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
              onClick={() => setDrawerOpen(false)}
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
                Plaćanje pouzećem • Dostava {PRODUCT.delivery}
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <Field
                label="Ime i prezime"
                value={form.name}
                onChange={(v) => setForm((p) => ({ ...p, name: v }))}
                placeholder="Npr. Stefan Racanović"
              />
              <Field
                label="Telefon"
                value={form.phone}
                onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
                placeholder="Npr. 066/..."
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Grad"
                  value={form.city}
                  onChange={(v) => setForm((p) => ({ ...p, city: v }))}
                  placeholder="Banja Luka"
                />
                <Field
                  label="Adresa"
                  value={form.address}
                  onChange={(v) => setForm((p) => ({ ...p, address: v }))}
                  placeholder="Ulica i broj"
                />
              </div>

              <Field
                label="Poruka (opciono)"
                value={form.message}
                onChange={(v) => setForm((p) => ({ ...p, message: v }))}
                placeholder="Npr. Volim te 💙"
              />
              <Field
                label="Pjesma / link (opciono)"
                value={form.song}
                onChange={(v) => setForm((p) => ({ ...p, song: v }))}
                placeholder="Npr. YouTube/Spotify link ili naziv pjesme"
              />
              <Field
                label="Napomena (opciono)"
                value={form.note}
                onChange={(v) => setForm((p) => ({ ...p, note: v }))}
                placeholder="Boja, rok, posebna želja..."
              />

              <div className="mt-2 rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-neutral-900 p-2 text-white">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold">Fotografiju pošalješ u poruci</div>
                    <div className="mt-1 text-neutral-600">
                      Nakon što klikneš Viber/WhatsApp, zalijepi tekst narudžbe i dodaj sliku kao attachment.
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-2">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className={`rounded-xl bg-gradient-to-r ${BRAND.accent} px-4 py-3 text-center text-sm font-semibold text-white shadow-sm hover:opacity-95`}
                >
                  Pošalji narudžbu na WhatsApp
                </a>

                <a
                  href={viberLink}
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center text-sm font-semibold hover:bg-neutral-50"
                >
                  Pošalji narudžbu na Viber
                </a>

                <button
                  onClick={copyText}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-neutral-50"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Kopirano!" : "Kopiraj tekst narudžbe"}
                </button>

                <div className="text-xs text-neutral-500">
                  * Ako Viber link ne radi u browseru, kopiraj tekst i zalijepi ručno u Viber poruku.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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

function StepCard({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-neutral-500">KORAK</div>
        <div className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
          {n}
        </div>
      </div>
      <div className="mt-3 text-lg font-semibold">{title}</div>
      <div className="mt-2 text-sm text-neutral-600">{desc}</div>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`rounded-xl bg-gradient-to-r ${BRAND.accent} p-2 text-white`}>
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
}: {
  label: string;
  price: number;
  note: string;
  onPick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
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
        className={`mt-5 w-full rounded-xl bg-gradient-to-r ${BRAND.accent} px-4 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95 active:scale-[0.99]`}
      >
        Izaberi paket
      </button>

      <div className="mt-4 text-xs text-neutral-500">
        Pouzeće • Dostava {PRODUCT.delivery}
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
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
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
