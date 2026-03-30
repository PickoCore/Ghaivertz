"use client";

import { useState, useCallback, useRef } from "react";
import Navbar from "@/components/shared/Navbar";
import { PLUGIN_META, IA_VERSIONS, NEXO_VERSIONS, ORAXEN_VERSIONS, isRouteSupported } from "@/lib/versions";
import type { PluginType } from "@/lib/versions";
import type { ConversionResult } from "@/lib/types";
import { runConversion } from "@/lib/converters";

type Step = "select" | "upload" | "converting" | "done";

const VERSION_MAP = {
  itemsadder: IA_VERSIONS,
  nexo: NEXO_VERSIONS,
  oraxen: ORAXEN_VERSIONS,
};

export default function ConvertPage() {
  const [step, setStep] = useState<Step>("select");
  const [from, setFrom] = useState<PluginType>("itemsadder");
  const [to, setTo] = useState<PluginType>("nexo");
  const [fromVersion, setFromVersion] = useState(IA_VERSIONS[0].value);
  const [toVersion, setToVersion] = useState(NEXO_VERSIONS[0].value);
  const [namespace, setNamespace] = useState("custom");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const PLUGINS: PluginType[] = ["itemsadder", "nexo", "oraxen"];

  function handleFromChange(p: PluginType) {
    setFrom(p);
    setFromVersion(VERSION_MAP[p][0].value);
    // Auto-pick first valid "to"
    const validTo = PLUGINS.filter((x) => x !== p && isRouteSupported(p, x));
    if (validTo.length > 0) {
      setTo(validTo[0]);
      setToVersion(VERSION_MAP[validTo[0]][0].value);
    }
  }

  function handleToChange(p: PluginType) {
    setTo(p);
    setToVersion(VERSION_MAP[p][0].value);
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith(".zip")) setFile(dropped);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  const canConvert = isRouteSupported(from, to);

  async function startConversion() {
    if (!file || !canConvert) return;
    setStep("converting");
    setProgress(0);
    setResult(null);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);

    const res = await runConversion({
      file,
      options: { from, to, fromVersion, toVersion },
      targetNamespace: namespace,
      onProgress: (msg, pct) => {
        setProgressMsg(msg);
        setProgress(pct);
      },
    });

    setProgress(100);
    setResult(res);

    if (res.zipBlob) {
      const url = URL.createObjectURL(res.zipBlob);
      setDownloadUrl(url);
    }

    setTimeout(() => setStep("done"), 400);
  }

  function reset() {
    setStep("select");
    setFile(null);
    setResult(null);
    setProgress(0);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
  }

  const fromMeta = PLUGIN_META[from];
  const toMeta = PLUGIN_META[to];

  return (
    <div className="min-h-screen mesh-bg grid-lines">
      <Navbar />

      <main className="max-w-4xl mx-auto px-5 pt-28 pb-24">
        {/* Header */}
        <div className="mb-10 animate-slide-up">
          <h1
            className="text-3xl font-extrabold mb-2"
            style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em" }}
          >
            Pack Converter
          </h1>
          <p style={{ color: "#6060a0", fontFamily: "'DM Sans', sans-serif" }}>
            Upload ZIP pack kamu, pilih versi, dan download hasil konversi.
          </p>
        </div>

        {/* Step 1 — Route + Version Selection */}
        {(step === "select" || step === "upload") && (
          <div className="space-y-5 animate-slide-up delay-100">
            {/* Plugin Selector */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold mb-4 uppercase tracking-widest" style={{ color: "#5050a0", fontFamily: "'DM Mono', monospace" }}>
                01 — Pilih Konversi
              </h2>

              <div className="grid grid-cols-3 gap-6 items-center">
                {/* FROM */}
                <div>
                  <label className="text-xs mb-2 block" style={{ color: "#5050a0" }}>Dari</label>
                  <div className="space-y-2">
                    {PLUGINS.map((p) => (
                      <button
                        key={p}
                        onClick={() => handleFromChange(p)}
                        className="w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left flex items-center gap-2"
                        style={{
                          background: from === p ? `${PLUGIN_META[p].color}18` : "#111118",
                          border: `1px solid ${from === p ? PLUGIN_META[p].color + "50" : "#1e1e2e"}`,
                          color: from === p ? PLUGIN_META[p].color : "#5050a0",
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        <span>{PLUGIN_META[p].icon}</span>
                        {PLUGIN_META[p].name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <div className="text-center">
                  <div
                    className="text-3xl font-bold"
                    style={{ color: canConvert ? "#7c6af7" : "#2a2a3e", fontFamily: "'Syne', sans-serif" }}
                  >
                    →
                  </div>
                  {!canConvert && (
                    <div className="text-xs mt-1" style={{ color: "#3a3a5a" }}>
                      Route ini belum<br />didukung
                    </div>
                  )}
                </div>

                {/* TO */}
                <div>
                  <label className="text-xs mb-2 block" style={{ color: "#5050a0" }}>Ke</label>
                  <div className="space-y-2">
                    {PLUGINS.map((p) => {
                      const supported = p !== from && isRouteSupported(from, p);
                      return (
                        <button
                          key={p}
                          onClick={() => supported && handleToChange(p)}
                          disabled={!supported}
                          className="w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left flex items-center gap-2"
                          style={{
                            background: to === p && supported ? `${PLUGIN_META[p].color}18` : "#111118",
                            border: `1px solid ${to === p && supported ? PLUGIN_META[p].color + "50" : "#1e1e2e"}`,
                            color: to === p && supported ? PLUGIN_META[p].color : "#2a2a4a",
                            fontFamily: "'DM Mono', monospace",
                            opacity: supported ? 1 : 0.4,
                            cursor: supported ? "pointer" : "not-allowed",
                          }}
                        >
                          <span>{PLUGIN_META[p].icon}</span>
                          {PLUGIN_META[p].name}
                          {!supported && p !== from && (
                            <span className="ml-auto text-xs" style={{ color: "#2a2a4a" }}>soon</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Version selectors */}
              {canConvert && (
                <div className="mt-5 pt-5 border-t grid grid-cols-2 gap-4" style={{ borderColor: "#1e1e2e" }}>
                  <div>
                    <label className="text-xs mb-2 block" style={{ color: "#5050a0" }}>
                      Versi {fromMeta.name}
                    </label>
                    <select
                      value={fromVersion}
                      onChange={(e) => setFromVersion(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{
                        background: "#0a0a0f",
                        border: "1px solid #1e1e2e",
                        color: fromMeta.color,
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      {VERSION_MAP[from].map((v) => (
                        <option key={v.value} value={v.value}>
                          {v.label} — MC {v.mcVersions}{v.notes ? ` (${v.notes})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs mb-2 block" style={{ color: "#5050a0" }}>
                      Versi {toMeta.name}
                    </label>
                    <select
                      value={toVersion}
                      onChange={(e) => setToVersion(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{
                        background: "#0a0a0f",
                        border: "1px solid #1e1e2e",
                        color: toMeta.color,
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      {VERSION_MAP[to].map((v) => (
                        <option key={v.value} value={v.value}>
                          {v.label} — MC {v.mcVersions}{v.notes ? ` (${v.notes})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Namespace input (only for Oraxen → IA) */}
                  {from === "oraxen" && to === "itemsadder" && (
                    <div className="col-span-2">
                      <label className="text-xs mb-2 block" style={{ color: "#5050a0" }}>
                        Target IA Namespace
                      </label>
                      <input
                        type="text"
                        value={namespace}
                        onChange={(e) => setNamespace(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                        placeholder="e.g. mynamespace"
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                        style={{
                          background: "#0a0a0f",
                          border: "1px solid #1e1e2e",
                          color: "#e2e2f0",
                          fontFamily: "'DM Mono', monospace",
                        }}
                      />
                      <p className="text-xs mt-1" style={{ color: "#3a3a5a" }}>
                        Oraxen ga pake namespace — kamu perlu kasih namespace buat struktur IA output.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2 — Upload */}
            {canConvert && (
              <div className="glass rounded-2xl p-6">
                <h2 className="text-sm font-semibold mb-4 uppercase tracking-widest" style={{ color: "#5050a0", fontFamily: "'DM Mono', monospace" }}>
                  02 — Upload Pack ZIP
                </h2>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200 ${isDragging ? "dropzone-active" : ""}`}
                  style={{ borderColor: file ? "#7c6af7" : "#1e1e2e", background: file ? "#7c6af706" : "#0a0a0f" }}
                >
                  <input ref={fileRef} type="file" accept=".zip" onChange={handleFileInput} className="hidden" />
                  {file ? (
                    <div>
                      <div className="text-3xl mb-2">📦</div>
                      <div className="font-medium" style={{ color: "#7c6af7", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
                        {file.name}
                      </div>
                      <div className="text-xs mt-1" style={{ color: "#5050a0" }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB — klik untuk ganti
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-3 animate-float">📂</div>
                      <div className="font-medium mb-1" style={{ fontFamily: "'Syne', sans-serif", fontSize: 15 }}>
                        Drop ZIP pack kamu di sini
                      </div>
                      <div className="text-sm" style={{ color: "#5050a0" }}>
                        atau klik untuk browse — hanya file .zip
                      </div>
                    </div>
                  )}
                </div>

                {/* Convert button */}
                {file && (
                  <button
                    onClick={startConversion}
                    className="mt-4 w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.01]"
                    style={{
                      background: "linear-gradient(135deg, #7c6af7, #e879f9)",
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 15,
                    }}
                  >
                    Convert {fromMeta.name} → {toMeta.name} →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step — Converting */}
        {step === "converting" && (
          <div className="glass rounded-2xl p-10 text-center animate-fade-in">
            <div className="text-5xl mb-5 animate-float">⚙️</div>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              Mengkonversi...
            </h2>
            <p className="text-sm mb-6" style={{ color: "#5050a0", fontFamily: "'DM Mono', monospace" }}>
              {progressMsg}
            </p>
            <div className="w-full rounded-full overflow-hidden" style={{ background: "#1e1e2e", height: 3 }}>
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <div className="text-xs mt-2" style={{ color: "#3a3a5a", fontFamily: "'DM Mono', monospace" }}>
              {progress}%
            </div>
          </div>
        )}

        {/* Step — Done */}
        {step === "done" && result && (
          <div className="space-y-4 animate-slide-up">
            {/* Result header */}
            <div
              className="glass rounded-2xl p-6"
              style={{ borderColor: result.success ? "#22d3ee30" : "#f9731630" }}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{result.success ? "✅" : "⚠️"}</div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {result.success ? "Konversi Berhasil!" : "Selesai dengan Errors"}
                  </h2>
                  <p className="text-sm" style={{ color: "#6060a0" }}>
                    {result.stats.convertedItems} item berhasil dikonversi
                    {result.stats.skippedItems > 0 && `, ${result.stats.skippedItems} dilewati`}
                    {" "}dari {result.stats.totalItems} total.
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t" style={{ borderColor: "#1e1e2e" }}>
                {[
                  { label: "Total Items", val: result.stats.totalItems },
                  { label: "Converted", val: result.stats.convertedItems, color: "#22d3ee" },
                  { label: "Skipped", val: result.stats.skippedItems, color: result.stats.skippedItems > 0 ? "#f97316" : undefined },
                  { label: "Files", val: result.stats.filesProcessed },
                ].map(({ label, val, color }) => (
                  <div key={label} className="text-center p-3 rounded-xl" style={{ background: "#0a0a0f" }}>
                    <div className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif", color: color ?? "#e2e2f0" }}>{val}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#4040a0", fontFamily: "'DM Mono', monospace" }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Download button */}
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download={`ghaivert-${from}-to-${to}-${Date.now()}.zip`}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #7c6af7, #e879f9)", fontFamily: "'Syne', sans-serif" }}
                >
                  📥 Download Hasil Konversi
                </a>
              )}
            </div>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="glass rounded-2xl p-5" style={{ borderColor: "#f97316"+"30" }}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: "'DM Mono', monospace", color: "#f97316" }}>
                  ⚠️ Warnings ({result.warnings.length})
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {result.warnings.map((w, i) => (
                    <div key={i} className="text-xs px-3 py-2 rounded-lg" style={{ background: "#f9731608", color: "#f97316a0", fontFamily: "'DM Mono', monospace" }}>
                      {w}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="glass rounded-2xl p-5" style={{ borderColor: "#ef4444"+"30" }}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: "'DM Mono', monospace", color: "#ef4444" }}>
                  ❌ Errors ({result.errors.length})
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {result.errors.map((e, i) => (
                    <div key={i} className="text-xs px-3 py-2 rounded-lg" style={{ background: "#ef444408", color: "#ef4444a0", fontFamily: "'DM Mono', monospace" }}>
                      {e}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Convert again */}
            <button
              onClick={reset}
              className="w-full py-3 rounded-xl font-medium transition-all hover:scale-[1.01]"
              style={{
                background: "#111118",
                border: "1px solid #1e1e2e",
                color: "#6060a0",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              ← Convert Lagi
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
