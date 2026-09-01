import React from "react";

/**
 * Bayan — Landing Page (v3)
 * ---------------------------------------------------------------
 * Provincial Last-Mile Logistics & Local E-Commerce Platform
 *
 * Theme: purple brand core #673de6 + ink charcoal + amber accent,
 * rounded-2xl cards, gradient hero with glow orbs (PRD §9).
 * Content sourced from bayanbox-prd-v3.md and RULES-PER-ACCOUNT.md.
 *
 * Pure React + Tailwind — no external imports beyond React.
 */

const BRAND = "#673de6";

const FEATURES = [
  {
    icon: "🛒",
    title: "Local E-Commerce Marketplace",
    tag: "B2C",
    body: "Browse, search, and buy from verified local micro-merchants — sari-sari stores and MSMEs in your province. Pay with GCash, Maya, Cash on Delivery, Suki Points, or even your affiliate earnings.",
  },
  {
    icon: "🛵",
    title: "Last-Mile Delivery, Store to Door",
    tag: "100 km",
    body: "Riders pick up straight from the merchant's store and deliver to your doorstep — with a delivery PIN and photo proof of delivery. Dynamic per-km fees, surge-aware pricing, and round-robin dispatch keep it fair and fast.",
  },
  {
    icon: "🤝",
    title: "Affiliate Program",
    tag: "Earn ₱",
    body: "Share your referral code, QR, or poster and earn commissions on every order your referrals place. Every peso is traceable by source, held safely for a 72-hour grace period, then released to your wallet.",
  },
  {
    icon: "⭐",
    title: "Suki Points Loyalty",
    tag: "Rewards",
    body: "Earn Suki Points on every purchase and review, then redeem them in the Points Shop — including points-only products and packaging supplies for your own store.",
  },
  {
    icon: "🧑‍🔧",
    title: "Skilled Worker Marketplace",
    tag: "Verified",
    body: "Hire verified local providers — electricians, repairmen, and more — with official badges, reviews, hourly rates, and two-party completion: you confirm the job or request rework.",
  },
  {
    icon: "🏬",
    title: "Bayan Mall",
    tag: "0% Rake",
    body: "Our admin-owned flagship store for official provincial goods and packaging. Every sale goes 100% to operations — zero platform commission — so the community gets fair prices.",
  },
  {
    icon: "📴",
    title: "Offline-First PWA",
    tag: "Works Offline",
    body: "A fullscreen app that keeps working when signal drops. Orders queue on your device and sync automatically the moment you're back online.",
  },
  {
    icon: "🧾",
    title: "Transparent Earnings & Settlement",
    tag: "v3",
    body: "Every role sees exactly where money comes from: per-role earnings traceability, double-entry ledgers, and admin/staff financial settlement for collected COD cash.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Browse your province's marketplace",
    body: "Discover products from verified local merchants — no login needed to look around.",
  },
  {
    step: "02",
    title: "Order & pay your way",
    body: "Check out with GCash, Maya, COD, Suki Points, or affiliate balance. Choose pickup or delivery.",
  },
  {
    step: "03",
    title: "Merchant prepares, rider picks up",
    body: "The store fulfills your order; a nearby rider is assigned round-robin and heads to the store.",
  },
  {
    step: "04",
    title: "Doorstep delivery with proof",
    body: "Your rider follows the store-to-door route and hands over the parcel with a delivery PIN and photo proof.",
  },
  {
    step: "05",
    title: "Earn while you shop",
    body: "Collect Suki Points, unlock affiliate commissions, and watch every movement in your ledger.",
  },
];

const STATS = [
  { value: "100 km", label: "Delivery service area — fair fees, never runaway quotes" },
  { value: "85/15", label: "Rider split on every delivery fee" },
  { value: "90/10", label: "Merchant/platform split on every marketplace sale" },
  { value: "72h", label: "Affiliate commission grace period before release" },
  { value: "₱200", label: "Minimum affiliate cash-out, once ID-verified" },
];

const TESTIMONIALS = [
  {
    quote:
      "I shop from my sari-sari store's suppliers and local home cooks, and the rider brings everything to my door. I even earn Suki Points and referral commissions on top.",
    name: "Juan Dela Cruz",
    role: "Customer · Tara, Sipocot",
    avatar: "JD",
  },
  {
    quote:
      "My delivery fee now measures from my store to the customer — not from some hub. I keep 90% of sales, and the dashboard shows exactly what I earned today.",
    name: "Mang Juan",
    role: "Verified Merchant · Mang Juan Store",
    avatar: "MJ",
  },
  {
    quote:
      "The merchant-to-customer map tells me exactly where to go, and I keep 85% of every delivery. COD cash I collect gets remitted cleanly at the hub.",
    name: "Rico the Rider",
    role: "Rider · Bayan delivery partner",
    avatar: "RR",
  },
];

const FOOTER_LINKS = [
  {
    heading: "Platform",
    links: ["Marketplace", "Bayan Mall", "Points Shop", "Skilled Workers", "Delivery"],
  },
  {
    heading: "For Partners",
    links: ["Merchants", "Riders", "Affiliates", "Providers", "Hubs & Staff"],
  },
  {
    heading: "Company",
    links: ["About", "Changelog (v3)", "Support", "Incidents & Safety", "Contact"],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0e0d16] text-slate-100 font-[DM_Sans,ui-sans-serif,system-ui,sans-serif] antialiased">
      {/* ------------------------------------------------ Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0e0d16]/90 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-lg shadow-[#673de6]/40"
              style={{ backgroundColor: BRAND }}
            >
              🧊
            </span>
            <span>
              Bayan<span className="text-[#a78bfa]">Box</span>
            </span>
          </a>
          <div className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#how-it-works" className="transition hover:text-white">How it works</a>
            <a href="#stats" className="transition hover:text-white">Why Bayan</a>
            <a href="#stories" className="transition hover:text-white">Stories</a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-200 transition hover:text-white sm:block"
            >
              Log in
            </a>
            <a
              href="/register"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#673de6]/40 transition hover:opacity-90"
              style={{ backgroundColor: BRAND }}
            >
              Get started
            </a>
          </div>
        </nav>
      </header>

      {/* ------------------------------------------------ Hero */}
      <section className="relative overflow-hidden">
        {/* Glow orbs */}
        <div
          className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(103, 61, 230, 0.35)" }}
        />
        <div
          className="pointer-events-none absolute top-40 -right-24 h-96 w-96 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(217, 119, 6, 0.18)" }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#0e0d16] to-transparent" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pt-20 pb-24 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#673de6]/40 bg-[#673de6]/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-[#a78bfa] uppercase">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Phygital provincial commerce — now on v3
            </span>
            <h1 className="mt-6 text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Shop local. Deliver fast.{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(90deg, #a78bfa, #673de6 55%, #f59e0b)",
                }}
              >
                Earn while you do.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              Bayan is the all-in-one platform for Philippine provinces — a local
              marketplace, last-mile delivery from merchant to doorstep, Suki Points
              rewards, and an affiliate program — connecting micro-merchants, riders,
              customers, and skilled workers in one trusted ecosystem.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="/register"
                className="rounded-2xl px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-[#673de6]/40 transition hover:-translate-y-0.5 hover:opacity-90"
                style={{ backgroundColor: BRAND }}
              >
                Start shopping
              </a>
              <a
                href="/register?role=merchant"
                className="rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:border-white/30 hover:bg-white/10"
              >
                Sell with Bayan →
              </a>
            </div>
            <p className="mt-5 text-xs text-slate-400">
              No login needed to browse. GCash · Maya · COD · Suki Points · Affiliate balance.
            </p>
          </div>

          {/* Hero mock card */}
          <div className="relative hidden lg:block">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Active delivery</p>
                <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300">
                  ● Live
                </span>
              </div>
              <div className="mt-5 rounded-2xl bg-[#12111d] p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#673de6]/20 text-2xl">
                    🏪
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">Mang Juan Store</p>
                    <p className="text-xs text-slate-400">Tara, Sipocot · pickup confirmed</p>
                  </div>
                </div>
                <div className="my-4 flex items-center gap-2 text-[#a78bfa]">
                  <span className="h-0.5 flex-1 rounded bg-[#673de6]/50" />
                  <span className="text-lg">🛵</span>
                  <span className="h-0.5 flex-1 rounded bg-[#673de6]/50" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/15 text-2xl">
                    🏠
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">Juan Dela Cruz</p>
                    <p className="text-xs text-slate-400">Store → door · 12.4 km · ₱86 fee</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                {[
                  ["90/10", "merchant split"],
                  ["85/15", "rider split"],
                  ["72h", "commission hold"],
                ].map(([v, l]) => (
                  <div key={v} className="rounded-xl bg-white/5 py-3">
                    <p className="text-sm font-extrabold text-white">{v}</p>
                    <p className="text-[10px] text-slate-400">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Stats band */}
      <section id="stats" className="relative border-y border-white/10 bg-[#12111d] py-14">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 md:grid-cols-3 lg:grid-cols-5">
          {STATS.map((stat) => (
            <div key={stat.value} className="text-center lg:text-left">
              <p
                className="bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl"
                style={{ backgroundImage: "linear-gradient(90deg, #a78bfa, #673de6)" }}
              >
                {stat.value}
              </p>
              <p className="mt-2 text-sm leading-snug text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ Features */}
      <section id="features" className="relative py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold tracking-widest text-[#a78bfa] uppercase">
              Everything in one platform
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Built for the province,{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(90deg, #a78bfa, #673de6)" }}
              >
                trusted by the community
              </span>
            </h2>
            <p className="mt-4 text-slate-400">
              Six roles, one ledger, zero guesswork — from browsing to doorstep delivery to
              settlement.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:border-[#673de6]/50 hover:shadow-xl hover:shadow-[#673de6]/10"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#673de6]/15 text-2xl">
                    {f.icon}
                  </span>
                  <span className="rounded-full bg-[#673de6]/15 px-3 py-1 text-[10px] font-bold tracking-wide text-[#a78bfa] uppercase">
                    {f.tag}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-bold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ How it works */}
      <section id="how-it-works" className="relative overflow-hidden py-24">
        <div
          className="pointer-events-none absolute top-1/3 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(103, 61, 230, 0.18)" }}
        />
        <div className="relative mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold tracking-widest text-[#a78bfa] uppercase">
              How it works
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              From marketplace to doorstep in five steps
            </h2>
          </div>

          <div className="mt-14 space-y-4">
            {STEPS.map((s, i) => (
              <div
                key={s.step}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:flex-row sm:items-center"
              >
                <span className="bg-clip-text text-4xl font-extrabold text-transparent sm:w-20"
                  style={{ backgroundImage: "linear-gradient(180deg, #a78bfa, #673de6)" }}
                >
                  {s.step}
                </span>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white">{s.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{s.body}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <span className="hidden text-[#673de6] sm:block">↓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Testimonials */}
      <section id="stories" className="border-t border-white/10 bg-[#12111d] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
              Stories from the community
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Loved by customers, merchants, and riders
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.name}
                className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="text-amber-400">★★★★★</div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-300">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: BRAND }}
                  >
                    {t.avatar}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ CTA */}
      <section className="relative overflow-hidden py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="relative overflow-hidden rounded-2xl border border-[#673de6]/40 p-10 text-center sm:p-14"
            style={{ backgroundImage: "linear-gradient(135deg, #673de6 0%, #4c2bb8 55%, #1f1b33 100%)" }}
          >
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
            <h2 className="relative text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Your province, on one platform.
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-slate-200">
              Join merchants, riders, customers, and skilled workers building a fairer local
              economy — with transparent splits, protected commissions, and delivery that
              actually reaches your door.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="/register"
                className="rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-[#4c2bb8] shadow-xl transition hover:-translate-y-0.5 hover:opacity-90"
              >
                Create a free account
              </a>
              <a
                href="/register?role=merchant"
                className="rounded-2xl border border-white/40 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Become a merchant
              </a>
            </div>
            <p className="relative mt-6 text-xs text-slate-300">
              Demo accounts: Admin · Staff · Rider · Merchant · Customer · Provider — password{" "}
              <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono">Password123!</code>
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Footer */}
      <footer className="border-t border-white/10 bg-[#0b0a12] py-14">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-xl font-bold text-white">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: BRAND }}
              >
                🧊
              </span>
              Bayan<span className="text-[#a78bfa]">Box</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              Provincial last-mile logistics & local e-commerce. Marketplace, delivery,
              loyalty, affiliates, and skilled workers — phygital, fair, and offline-first.
            </p>
          </div>
          {FOOTER_LINKS.map((col) => (
            <div key={col.heading}>
              <p className="text-sm font-bold text-white">{col.heading}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-slate-400 transition hover:text-white">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-12 max-w-7xl border-t border-white/10 px-6 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Bayan. Made for Philippine provinces —
          Tara, Sipocot and beyond. Built on Laravel 11 · React 18 · PostgreSQL 16.
        </div>
      </footer>
    </div>
  );
}
