// ============================================================
// Ghaivert — Main Converter Orchestrator
// ============================================================

import type { ConversionOptions, ConversionResult } from "../types";
import { parseIAPack } from "./ia-parser";
import { convertIAToNexo } from "./ia-to-nexo";
import { parseNexoPack, convertNexoToIA } from "./nexo-to-ia";
import { parseOraxenPack, convertOraxenToIA } from "./oraxen-to-ia";

export interface ConvertInput {
  file: File;
  options: ConversionOptions;
  /** Only needed for Oraxen→IA: user sets the target namespace */
  targetNamespace?: string;
  onProgress?: (step: string, pct: number) => void;
}

export async function runConversion(input: ConvertInput): Promise<ConversionResult> {
  const { file, options, targetNamespace, onProgress } = input;
  const progress = onProgress ?? (() => {});

  try {
    progress("Membaca file ZIP...", 10);

    // ── IA → Nexo ──────────────────────────────────────
    if (options.from === "itemsadder" && options.to === "nexo") {
      progress("Parsing ItemsAdder pack...", 25);
      const parsed = await parseIAPack(file);
      progress(`Ditemukan ${parsed.items.length} items, mengkonversi...`, 50);
      const result = await convertIAToNexo(parsed, options.toVersion);
      progress("Mengemas output ZIP...", 85);
      return result;
    }

    // ── Nexo → IA ──────────────────────────────────────
    if (options.from === "nexo" && options.to === "itemsadder") {
      progress("Parsing Nexo pack...", 25);
      const parsed = await parseNexoPack(file);
      progress(`Ditemukan ${parsed.items.length} items, mengkonversi...`, 50);
      const result = await convertNexoToIA(parsed, options.toVersion);
      progress("Mengemas output ZIP...", 85);
      return result;
    }

    // ── Oraxen → IA ────────────────────────────────────
    if (options.from === "oraxen" && options.to === "itemsadder") {
      progress("Parsing Oraxen pack...", 25);
      const parsed = await parseOraxenPack(file);
      progress(`Ditemukan ${parsed.items.length} items, mengkonversi...`, 50);
      const ns = targetNamespace ?? "custom";
      const result = await convertOraxenToIA(parsed, ns, options.toVersion);
      progress("Mengemas output ZIP...", 85);
      return result;
    }

    // ── Unsupported ────────────────────────────────────
    return {
      success: false,
      warnings: [],
      errors: [`Konversi ${options.from} → ${options.to} belum didukung. Coming soon!`],
      stats: { totalItems: 0, convertedItems: 0, skippedItems: 0, filesProcessed: 0 },
    };
  } catch (err) {
    return {
      success: false,
      warnings: [],
      errors: [`Unexpected error: ${err instanceof Error ? err.message : String(err)}`],
      stats: { totalItems: 0, convertedItems: 0, skippedItems: 0, filesProcessed: 0 },
    };
  }
}
