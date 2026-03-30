// ============================================================
// Ghaivert — Oraxen → IA Converter
// ============================================================

import JSZip from "jszip";
import yaml from "js-yaml";
import type { OraxenItem, IAConfig, IAItem, GhaivertItem, ConversionResult } from "../types";

export interface ParsedOraxenPack {
  items: GhaivertItem[];
  originalZip: JSZip;
  warnings: string[];
}

/**
 * Oraxen ZIP structure:
 * Oraxen/ (or root)
 *   items/
 *     *.yml
 *   pack/
 *     textures/  (or assets/<ns>/textures/)
 *     models/
 */
export async function parseOraxenPack(zipFile: File): Promise<ParsedOraxenPack> {
  const zip = await JSZip.loadAsync(zipFile);
  const warnings: string[] = [];
  const items: GhaivertItem[] = [];

  const ymlFiles = Object.keys(zip.files).filter((p) =>
    p.match(/Oraxen\/items\/.*\.yml$/) || p.match(/^items\/.*\.yml$/)
  );

  for (const filePath of ymlFiles) {
    const content = await zip.files[filePath].async("string");
    let parsed: Record<string, OraxenItem>;

    try {
      parsed = yaml.load(content) as Record<string, OraxenItem>;
    } catch (e) {
      warnings.push(`⚠️ Failed to parse YAML: ${filePath} — ${e}`);
      continue;
    }

    if (!parsed || typeof parsed !== "object") continue;

    for (const [itemId, item] of Object.entries(parsed)) {
      if (typeof item !== "object" || !item) continue;
      try {
        items.push(convertOraxenItemToIR(itemId, item, warnings));
      } catch (e) {
        warnings.push(`⚠️ Skipped ${itemId}: ${e}`);
      }
    }
  }

  return { items, originalZip: zip, warnings };
}

function convertOraxenItemToIR(
  itemId: string,
  item: OraxenItem,
  warnings: string[]
): GhaivertItem {
  const pack = item.Pack ?? {};
  let generateModel = pack.generate_model ?? false;
  let textures: string[] | Record<string, string> = [];
  let modelPath: string | undefined;
  const parentModel = pack.parent_model;

  if (!generateModel && pack.model) {
    modelPath = pack.model.replace(/\.json$/i, "");
    generateModel = false;
  } else if (generateModel && pack.textures) {
    if (Array.isArray(pack.textures)) {
      textures = pack.textures.map((t) => t.replace(/\.png$/i, ""));
    } else {
      textures = Object.fromEntries(
        Object.entries(pack.textures).map(([k, v]) => [k, (v as string).replace(/\.png$/i, "")])
      );
    }
  } else if (generateModel && !pack.textures) {
    warnings.push(`⚠️ ${itemId}: generate_model=true but no textures defined`);
  }

  const { Pack, ...rest } = item;
  void Pack;

  // Oraxen uses "displayname" (lowercase d)
  return {
    id: itemId,
    namespace: "custom",
    material: item.material ?? "PAPER",
    displayName: item.displayname,
    lore: item.lore,
    generateModel,
    textures,
    modelPath,
    parentModel,
    extra: rest,
    _source: "oraxen",
  };
}

// ─── Oraxen → IA ──────────────────────────────────────────

export async function convertOraxenToIA(
  parsed: ParsedOraxenPack,
  namespace: string,
  toVersion: string
): Promise<ConversionResult> {
  const warnings = [...parsed.warnings];
  const errors: string[] = [];
  const outZip = new JSZip();
  let convertedItems = 0;
  let skippedItems = 0;

  const iaConfig: IAConfig = {
    info: { namespace },
    items: {},
  };

  for (const item of parsed.items) {
    // Override namespace with user-provided one
    item.namespace = namespace;
    try {
      iaConfig.items![item.id] = buildIAItem(item, namespace, warnings);
      convertedItems++;
    } catch (e) {
      errors.push(`❌ ${item.id}: ${e}`);
      skippedItems++;
    }
  }

  const ymlContent = yaml.dump(iaConfig, { lineWidth: 200, quotingType: '"' });
  outZip.file(`contents/${namespace}/configs/items.yml`, ymlContent);

  // ── Copy assets ────────────────────────────────────────
  // Oraxen: Oraxen/pack/textures/... OR Oraxen/pack/assets/<ns>/textures/...
  // IA:     contents/<ns>/resourcepack/<ns>/textures/...

  const allFiles = Object.keys(parsed.originalZip.files);
  for (const filePath of allFiles) {
    if (parsed.originalZip.files[filePath].dir) continue;

    // Pattern 1: pack/assets/<ns>/textures/...
    const assetsMatch = filePath.match(/pack\/assets\/([^/]+)\/(textures|models|sounds)\//);
    if (assetsMatch) {
      const afterAssets = filePath.replace(/.*pack\/assets\/[^/]+\//, "");
      const iaPath = `contents/${namespace}/resourcepack/${namespace}/${afterAssets}`;
      try {
        const data = await parsed.originalZip.files[filePath].async("uint8array");
        outZip.file(iaPath, data);
      } catch { /* skip */ }
      continue;
    }

    // Pattern 2: pack/textures/... or pack/models/...
    const packMatch = filePath.match(/pack\/(textures|models|sounds)\/(.+)$/);
    if (packMatch) {
      const [, type, rest] = packMatch;
      const iaPath = `contents/${namespace}/resourcepack/${namespace}/${type}/${rest}`;
      try {
        const data = await parsed.originalZip.files[filePath].async("uint8array");
        outZip.file(iaPath, data);
      } catch { /* skip */ }
    }
  }

  outZip.file("README-GHAIVERT.md", generateIAReadme(toVersion, namespace, warnings));

  const zipBlob = await outZip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return {
    success: errors.length === 0,
    zipBlob,
    warnings,
    errors,
    stats: {
      totalItems: parsed.items.length,
      convertedItems,
      skippedItems,
      filesProcessed: allFiles.length,
    },
  };
}

function buildIAItem(
  item: GhaivertItem,
  namespace: string,
  warnings: string[]
): IAItem {
  const iaItem: IAItem = {
    enabled: true,
    display_name: item.displayName ?? item.id,
  };

  if (item.lore?.length) iaItem.lore = item.lore;

  if (item.generateModel) {
    const texList = Array.isArray(item.textures) ? item.textures : Object.values(item.textures);
    iaItem.resource = {
      material: item.material,
      generate: true,
      textures: texList,
    };
  } else if (item.modelPath) {
    iaItem.resource = {
      material: item.material,
      generate: false,
      model_path: item.modelPath,
    };
  } else {
    warnings.push(`⚠️ ${namespace}:${item.id}: no texture/model found`);
    iaItem.resource = { material: item.material, generate: false };
  }

  // Durability passthrough
  const durVal = (item.extra?.durability as Record<string, unknown>)?.value;
  if (durVal) iaItem.durability = { max_custom_durability: durVal as number };

  return iaItem;
}

function generateIAReadme(version: string, namespace: string, warnings: string[]): string {
  return `# Converted by Ghaivert
**Target:** ItemsAdder ${version}  
**Namespace:** ${namespace}  
**Tool:** ghaivert.vercel.app  

## Installation
1. Drop the \`contents/\` folder into \`plugins/ItemsAdder/\`
2. Run \`/iazip\`
3. Review warnings below

## ⚠️ Manual Review Required
- **Mechanics** (Oraxen stringblock/noteblock/furniture) — recreate with IA behaviours
- **Texture paths** — Oraxen textures may use different naming conventions

## Warnings (${warnings.length})
${warnings.map((w) => `- ${w}`).join("\n") || "None!"}
`;
}
