import Navbar from "@/components/shared/Navbar";
import Link from "next/link";

const ROUTES_DETAIL = [
  {
    from: "ItemsAdder", fromColor: "#f97316",
    to: "Nexo", toColor: "#22d3ee",
    mappings: [
      { ia: "resource.material", nexo: "material" },
      { ia: "resource.generate: true + textures[]", nexo: "Pack.texture / Pack.textures[]" },
      { ia: "resource.generate: false + model_path", nexo: "Pack.model" },
      { ia: "resource.textures[0]", nexo: "Pack.parent_model (auto-detected)" },
      { ia: "display_name", nexo: "itemname" },
      { ia: "durability.max_custom_durability", nexo: "Components.max_damage" },
    ],
    notConverted: ["behaviours (furniture, machinery)", "events", "specific_properties", "nbt"],
  },
  {
    from: "Nexo", fromColor: "#22d3ee",
    to: "ItemsAdder", toColor: "#f97316",
    mappings: [
      { ia: "material", nexo: "material" },
      { ia: "Pack.texture / Pack.textures[]", nexo: "resource.generate: true + textures[]" },
      { ia: "Pack.model", nexo: "resource.generate: false + model_path" },
      { ia: "itemname / displayname", nexo: "display_name" },
      { ia: "Components.max_damage", nexo: "durability.max_custom_durability" },
    ],
    notConverted: ["Mechanics (stringblock, noteblock, furniture)", "Components (advanced)", "Sounds"],
  },
  {
    from: "Oraxen", fromColor: "#a78bfa",
    to: "ItemsAdder", toColor: "#f97316",
    mappings: [
      { ia: "material", nexo: "material" },
      { ia: "Pack.generate_model: true + textures[]", nexo: "resource.generate: true + textures[]" },
      { ia: "Pack.generate_model: false + model", nexo: "resource.generate: false + model_path" },
      { ia: "displayname", nexo: "display_name" },
    ],
    notConverted: ["Mechanics (stringblock, noteblock, furniture)", "custom_model_data", "Sounds"],
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen mesh-bg grid-lines">
      <Navbar />

      <main className="max-w-4xl mx-auto px-5 pt-28 pb-24">
        <div className="mb-10 animate-slide-up">
          <h1 className="text-3xl font-extrabold mb-2" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em" }}>
            About Ghaivert
          </h1>
          <p style={{ color: "#6060a0" }}>
            Gimana conversion bekerja, field mapping, dan limitations yang perlu lo tau.
          </p>
        </div>

        {/* What is this */}
        <div className="glass rounded-2xl p-6 mb-5 animate-slide-up delay-100">
          <h2 className="font-bold mb-3 text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Apa itu Ghaivert?</h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "#7070a0" }}>
            Ghaivert adalah tool konversi resource pack Minecraft berbasis browser untuk{" "}
            <strong style={{ color: "#f97316" }}>ItemsAdder</strong>,{" "}
            <strong style={{ color: "#22d3ee" }}>Nexo</strong>, dan{" "}
            <strong style={{ color: "#a78bfa" }}>Oraxen</strong>.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#7070a0" }}>
            Semua proses terjadi <strong style={{ color: "#e2e2f0" }}>100% di browser</strong> kamu —
            tidak ada file yang dikirim ke server. Privasi terjaga, dan konversi tetap cepat meski pack kamu besar.
          </p>
        </div>

        {/* Conversion details */}
        <div className="space-y-4">
          {ROUTES_DETAIL.map((r, i) => (
            <div
              key={i}
              className="glass rounded-2xl p-6 animate-slide-up"
              style={{ animationDelay: `${0.1 + i * 0.08}s`, animationFillMode: "both" }}
            >
              {/* Route header */}
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="px-2.5 py-1 rounded-lg text-sm font-bold"
                  style={{ background: `${r.fromColor}18`, color: r.fromColor, border: `1px solid ${r.fromColor}30`, fontFamily: "'DM Mono', monospace" }}
                >
                  {r.from}
                </span>
                <span style={{ color: "#3a3a5a" }}>→</span>
                <span
                  className="px-2.5 py-1 rounded-lg text-sm font-bold"
                  style={{ background: `${r.toColor}18`, color: r.toColor, border: `1px solid ${r.toColor}30`, fontFamily: "'DM Mono', monospace" }}
                >
                  {r.to}
                </span>
              </div>

              {/* Field mapping table */}
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#4040a0", fontFamily: "'DM Mono', monospace" }}>
                Field Mapping
              </h3>
              <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid #1e1e2e" }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: "#111118" }}>
                      <th className="text-left px-3 py-2 font-medium" style={{ color: r.fromColor, fontFamily: "'DM Mono', monospace", width: "50%" }}>
                        {r.from}
                      </th>
                      <th className="text-left px-3 py-2 font-medium" style={{ color: r.toColor, fontFamily: "'DM Mono', monospace" }}>
                        {r.to}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.mappings.map((m, j) => (
                      <tr key={j} style={{ borderTop: "1px solid #1e1e2e" }}>
                        <td className="px-3 py-2" style={{ fontFamily: "'DM Mono', monospace", color: "#7070a0" }}>{m.ia}</td>
                        <td className="px-3 py-2" style={{ fontFamily: "'DM Mono', monospace", color: "#7070a0" }}>{m.nexo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Not converted */}
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#4040a0", fontFamily: "'DM Mono', monospace" }}>
                ⚠️ Perlu Review Manual
              </h3>
              <div className="flex flex-wrap gap-2">
                {r.notConverted.map((f) => (
                  <span
                    key={f}
                    className="px-2 py-1 rounded-lg text-xs"
                    style={{ background: "#f9731608", color: "#f97316a0", border: "1px solid #f9731620", fontFamily: "'DM Mono', monospace" }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Asset handling */}
        <div className="glass rounded-2xl p-6 mt-4 animate-slide-up delay-400">
          <h2 className="font-bold mb-3 text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Asset & File Structure</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs" style={{ fontFamily: "'DM Mono', monospace", color: "#5050a0" }}>
            {[
              {
                label: "ItemsAdder", color: "#f97316",
                path: `contents/<ns>/\n  configs/items/*.yml\n  resourcepack/<ns>/\n    textures/item/\n    models/item/\n    sounds/`,
              },
              {
                label: "Nexo", color: "#22d3ee",
                path: `Nexo/\n  items/<ns>.yml\n  pack/assets/<ns>/\n    textures/item/\n    models/item/`,
              },
              {
                label: "Oraxen", color: "#a78bfa",
                path: `Oraxen/\n  items/*.yml\n  pack/\n    textures/item/\n    models/item/`,
              },
            ].map((p) => (
              <div key={p.label} className="rounded-xl p-3" style={{ background: "#0a0a0f", border: "1px solid #1e1e2e" }}>
                <div className="font-bold mb-2" style={{ color: p.color }}>{p.label}</div>
                <pre className="text-xs leading-relaxed whitespace-pre" style={{ color: "#4040a0" }}>{p.path}</pre>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link
            href="/convert"
            className="inline-block px-8 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #7c6af7, #e879f9)", fontFamily: "'Syne', sans-serif" }}
          >
            Coba Sekarang →
          </Link>
        </div>
      </main>
    </div>
  );
}
