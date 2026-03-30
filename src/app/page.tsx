import Link from "next/link";
import Navbar from "@/components/shared/Navbar";

const ROUTES = [
  { from: "ItemsAdder", to: "Nexo", fromColor: "#f97316", toColor: "#22d3ee", badge: "Popular" },
  { from: "Nexo", to: "ItemsAdder", fromColor: "#22d3ee", toColor: "#f97316", badge: null },
  { from: "Oraxen", to: "ItemsAdder", fromColor: "#a78bfa", toColor: "#f97316", badge: null },
];

const FEATURES = [
  {
    icon: "⚡",
    title: "100% Browser-Based",
    desc: "Semua konversi terjadi di browser kamu. File kamu ga pernah dikirim ke server manapun.",
  },
  {
    icon: "📦",
    title: "Full Pack Conversion",
    desc: "Convert YML config + folder struktur aset sekaligus. ZIP in, ZIP out.",
  },
  {
    icon: "⚙️",
    title: "Version-Aware",
    desc: "Pilih versi plugin sumber & target. Mapping disesuaikan otomatis per versi.",
  },
  {
    icon: "📋",
    title: "Detailed Report",
    desc: "Setiap konversi menghasilkan laporan lengkap: item converted, warning, hal yang perlu di-review manual.",
  },
  {
    icon: "🆓",
    title: "Gratis Selamanya",
    desc: "Tool ini gratis. Orang lain nge-charge 200K buat ini — kita enggak.",
  },
  {
    icon: "🔒",
    title: "Privacy First",
    desc: "File kamu ga pernah meninggalkan browser. Zero upload, zero tracking.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen mesh-bg grid-lines">
      <Navbar />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-36 pb-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 animate-fade-in" style={{ background: "#111118", border: "1px solid #2a2a3e" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs" style={{ color: "#7070a0", fontFamily: "'DM Mono', monospace" }}>
            Free • Browser-based • No signup
          </span>
        </div>

        <h1
          className="text-5xl md:text-7xl font-extrabold leading-none mb-6 animate-slide-up"
          style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.04em" }}
        >
          Convert Packs
          <br />
          <span className="shimmer-text">Instantly.</span>
        </h1>

        <p className="text-lg max-w-xl mx-auto mb-10 animate-slide-up delay-100" style={{ color: "#7070a0" }}>
          Konversi resource pack antara <strong style={{ color: "#f97316" }}>ItemsAdder</strong>,{" "}
          <strong style={{ color: "#22d3ee" }}>Nexo</strong>, dan{" "}
          <strong style={{ color: "#a78bfa" }}>Oraxen</strong> — gratis, langsung di browser, tanpa install apapun.
        </p>

        <div className="flex items-center justify-center gap-3 animate-slide-up delay-200">
          <Link
            href="/convert"
            className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105 hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #7c6af7, #e879f9)", fontFamily: "'DM Sans', sans-serif" }}
          >
            Start Converting →
          </Link>
          <a
            href="https://github.com/ghaa-id/ghaivert"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
            style={{ background: "#111118", border: "1px solid #1e1e2e", color: "#a0a0c0", fontFamily: "'DM Sans', sans-serif" }}
          >
            View Source
          </a>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mt-16 animate-fade-in delay-400">
          {[
            { val: "3", label: "Supported Plugins" },
            { val: "3", label: "Conversion Routes" },
            { val: "100%", label: "Free Forever" },
          ].map(({ val, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold grad-text" style={{ fontFamily: "'Syne', sans-serif" }}>{val}</div>
              <div className="text-xs mt-0.5" style={{ color: "#5050a0", fontFamily: "'DM Mono', monospace" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Conversion Routes */}
      <section className="max-w-6xl mx-auto px-5 pb-24">
        <h2
          className="text-2xl font-bold mb-8 text-center"
          style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em" }}
        >
          Supported Conversions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ROUTES.map((r) => (
            <Link
              key={`${r.from}-${r.to}`}
              href="/convert"
              className="glass rounded-2xl p-5 group hover:border-opacity-60 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
              style={{ borderColor: "#1e1e2e" }}
            >
              {r.badge && (
                <span
                  className="absolute top-4 right-4 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "#7c6af720", color: "#7c6af7", border: "1px solid #7c6af730", fontFamily: "'DM Mono', monospace" }}
                >
                  {r.badge}
                </span>
              )}
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="text-sm font-bold px-2.5 py-1 rounded-lg"
                  style={{ background: `${r.fromColor}18`, color: r.fromColor, border: `1px solid ${r.fromColor}30`, fontFamily: "'DM Mono', monospace" }}
                >
                  {r.from}
                </span>
                <span style={{ color: "#3a3a5a" }}>→</span>
                <span
                  className="text-sm font-bold px-2.5 py-1 rounded-lg"
                  style={{ background: `${r.toColor}18`, color: r.toColor, border: `1px solid ${r.toColor}30`, fontFamily: "'DM Mono', monospace" }}
                >
                  {r.to}
                </span>
              </div>
              <p className="text-sm" style={{ color: "#6060a0" }}>
                Convert pack dari {r.from} ke {r.to}. YML config + file assets.
              </p>
              <div
                className="mt-3 text-xs font-medium transition-all duration-200 opacity-0 group-hover:opacity-100"
                style={{ color: "#7c6af7" }}
              >
                Convert sekarang →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-5 pb-32">
        <h2
          className="text-2xl font-bold mb-8 text-center"
          style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em" }}
        >
          Why Ghaivert?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="glass rounded-2xl p-5 animate-slide-up"
              style={{ animationDelay: `${i * 0.08}s`, animationFillMode: "both" }}
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-1.5 text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#6060a0" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-5 pb-24">
        <div
          className="rounded-3xl p-12 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #7c6af715, #e879f908)", border: "1px solid #7c6af725" }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{ background: "radial-gradient(ellipse at center, #7c6af720 0%, transparent 70%)" }}
          />
          <h2
            className="text-3xl font-extrabold mb-3 relative"
            style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em" }}
          >
            Siap convert pack kamu?
          </h2>
          <p className="mb-6 relative" style={{ color: "#7070a0" }}>
            Gratis, cepat, privacy-first. No signup needed.
          </p>
          <Link
            href="/convert"
            className="inline-block px-8 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #7c6af7, #e879f9)", fontFamily: "'DM Sans', sans-serif" }}
          >
            Open Converter →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: "#1e1e2e" }}>
        <div className="max-w-6xl mx-auto px-5 py-6 flex items-center justify-between">
          <div className="text-sm" style={{ color: "#3a3a5a", fontFamily: "'DM Mono', monospace" }}>
            ghaivert by{" "}
            <a href="https://ghaa.my.id" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors" style={{ color: "#5050a0" }}>
              ghaa
            </a>
          </div>
          <div className="text-xs" style={{ color: "#2a2a4a", fontFamily: "'DM Mono', monospace" }}>
            not affiliated with IA, Nexo, or Oraxen
          </div>
        </div>
      </footer>
    </div>
  );
}
