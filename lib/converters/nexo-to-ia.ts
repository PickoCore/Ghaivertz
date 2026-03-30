// ============================================================
// Ghaivert — Nexo → IA Converter
// ============================================================

import JSZip from "jszip";
import yaml from "js-yaml";
import type { NexoItem, NexoPack, IAConfig, IAItem, GhaivertItem, ConversionResult } from "../types";

export interface ParsedNexoPack {
  items: GhaivertItem[];
  assetsZip: JSZip;
  originalZip: JSZip;
  warnings: string[];
}

/**
 * Nexo ZIP structure (items-only upload from user):
 * Nexo/
 *   items/
 *     *.yml
 *   pack/
 *     assets/
 *       <namespace>/
 *         textures/
 *         models/
 */
export async function parseNexoPack(zipFile: File): Promise<ParsedNexoPack> {
  const zip = await JSZip.loadAsync(zipFile);
  const warnings: string[] = [];
  const items: GhaivertItem[] = [];

  const ymlFiles = Object.keys(zip.files).filter((p) =>
    p.match(/Nexo\/items\/.*\.yml$/) || p.match(/^items\/.*\.yml$/)
  );

  for (const filePath of ymlFiles) {
    const content = await zip.files[filePath].async("string");
    let parsed: Record<string, NexoItem>;

    try {
      parsed = yaml.load(content) as Record<string, NexoItem>;
    } catch (e) {
      warnings.push(`⚠️ Failed to parse YAML: ${filePath} — ${e}`);
      continue;
    }

    if (!parsed || typeof parsed !== "object") continue;

    for (const [itemId, item] of Object.entries(parsed)) {
      if (typeof item !== "object" || !item) continue;
      try {
        items.push(convertNexoItemToIR(itemId, item, warnings));
      } catch (e) {
        warnings.push(`⚠️ Skipped ${itemId}: ${e}`);
      }
    }
  }

  return { items, assetsZip: zip, originalZip: zip, warnings };
}

function convertNexoItemToIR(
  itemId: string,
  item: NexoItem,
  warnings: string[]
): GhaivertItem {
  const pack = item.Pack ?? {};
  const namespace = extractNamespace(pack, itemId);
  let generateModel = false;
  let textures: string[] | Record<string, string> = [];
  let modelPath: string | undefined;
  let parentModel = pack.parent_model;

  if (pack.model) {
    // Custom model path
    modelPath = stripNamespace(pack.model);
    generateModel = false;
  } else if (pack.texture) {
    // Single texture → generate
    generateModel = true;
    textures = [stripNamespace(pack.texture)];
    parentModel = pack.parent_model ?? "item/generated";
  } else if (pack.textures) {
    generateModel = true;
    if (Array.isArray(pack.textures)) {
      textures = pack.textures.map(stripNamespace);
    } else {
      textures = Object.fromEntries(
        Object.entries(pack.textures).map(([k, v]) => [k, stripNamespace(v)])
      );
    }
    parentModel = pack.parent_model ?? "item/generated";
  } else {
    warnings.push(`⚠️ Item ${itemId}: no Pack texture/model found`);
  }

  const { Pack, ...rest } = item;
  void Pack;

  return {
    id: itemId,
    namespace,
    material: item.material ?? "PAPER",
    displayName: item.itemname ?? item.displayname,
    lore: item.lore,
    generateModel,
    textures,
    modelPath,
    parentModel,
    extra: rest,
    _source: "nexo",
  };
}

// ─── Nexo → IA ────────────────────────────────────────────

export async function convertNexoToIA(
  parsed: ParsedNexoPack,
  toVersion: string
): Promise<ConversionResult> {
  const warnings = [...parsed.warnings];
  const errors: string[] = [];
  const outZip = new JSZip();
  let convertedItems = 0;
  let skippedItems = 0;

  // Group by namespace
  const byNamespace = new Map<string, GhaivertItem[]>();
  for (const item of parsed.items) {
    if (!byNamespace.has(item.namespace)) byNamespace.set(item.namespace, []);
    byNamespace.get(item.namespace)!.push(item);
  }

  for (const [namespace, items] of Array.from(byNamespace)) {
    const iaConfig: IAConfig = {
      info: { namespace },
      items: {},
    };

    for (const item of items) {
      try {
        iaConfig.items![item.id] = convertItemToIA(item, namespace, warnings);
        convertedItems++;
      } catch (e) {
        errors.push(`❌ ${namespace}:${item.id} — ${e}`);
        skippedItems++;
      }
    }

    const ymlContent = yaml.dump(iaConfig, { lineWidth: 200, quotingType: '"' });
    outZip.file(`contents/${namespace}/configs/items.yml`, ymlContent);
  }

  // ── Copy assets ────────────────────────────────────────
  // Nexo: Nexo/pack/assets/<ns>/textures/...
  // IA: contents/<ns>/resourcepack/<ns>/textures/...
  const assetFiles = Object.keys(parsed.originalZip.files).filter(
    (p) => p.includes("/pack/assets/") || p.includes("/pack/textures/") || p.includes("/pack/models/")
  );

  for (const assetPath of assetFiles) {
    if (parsed.originalZip.files[assetPath].dir) continue;

    // Try to extract namespace from path
    // Nexo/pack/assets/<ns>/textures/item/name.png
    const assetsMatch = assetPath.match(/pack\/assets\/([^/]+)\/(.+)$/);
    if (assetsMatch) {
      const [, ns, rest] = assetsMatch;
      const iaPath = `contents/${ns}/resourcepack/${ns}/${rest}`;
      try {
        const data = await parsed.originalZip.files[assetPath].async("uint8array");
        outZip.file(iaPath, data);
      } catch (e) {
        warnings.push(`⚠️ Could not copy ${assetPath}: ${e}`);
      }
    } else {
      // Nexo/pack/textures/<name>.png (no namespace folder)
      const packMatch = assetPath.match(/pack\/(textures|models|sounds)\/(.+)$/);
      if (packMatch) {
        const [, type, rest] = packMatch;
        // Use "minecraft" as namespace fallback
        const iaPath = `contents/minecraft/resourcepack/minecraft/${type}/${rest}`;
        try {
          const data = await parsed.originalZip.files[assetPath].async("uint8array");
          outZip.file(iaPath, data);
        } catch (e) {
          warnings.push(`⚠️ Could not copy ${assetPath}: ${e}`);
        }
      }
    }
  }

  outZip.file("README-GHAIVERT.md", generateIAReadme(toVersion, warnings));

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
      filesProcessed: Object.keys(parsed.originalZip.files).length,
    },
  };
}

function convertItemToIA(
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
    const textures = Array.isArray(item.textures) ? item.textures : Object.values(item.textures);
    iaItem.resource = {
      material: item.material,
      generate: true,
      textures: textures,
    };
  } else if (item.modelPath) {
    iaItem.resource = {
      material: item.material,
      generate: false,
      model_path: item.modelPath,
    };
  } else {
    warnings.push(`⚠️ ${namespace}:${item.id}: no texture/model — resource section may be empty`);
    iaItem.resource = { material: item.material, generate: false };
  }

  // Passthrough durability
  const compDamage = (item.extra?.Components as Record<string, unknown>)?.max_damage;
  if (compDamage) {
    iaItem.durability = { max_custom_durability: compDamage as number };
  }

  return iaItem;
}

// ─── Helpers ──────────────────────────────────────────────

function extractNamespace(pack: NexoPack, itemId: string): string {
  const ref = pack.texture ?? pack.model ?? (Array.isArray(pack.textures) ? pack.textures?.[0] : undefined);
  if (typeof ref === "string" && ref.includes(":")) {
    return ref.split(":")[0];
  }
  return "custom"; // fallback
}

function stripNamespace(path: string): string {
  // "namespace:item/name" → "item/name"
  return path.includes(":") ? path.split(":").slice(1).join(":") : path;
}

function generateIAReadme(version: string, warnings: string[]): string {
  return `# Converted by Ghaivert
**Target:** ItemsAdder ${version}  
**Tool:** ghaivert.vercel.app  

## Installation
1. Drop the \`contents/\` folder into \`plugins/ItemsAdder/\`
2. Run \`/iazip\` to regenerate the resource pack
3. Review warnings below

## ⚠️ Manual Review Required
- **Mechanics** (Nexo-specific: noteblock, stringblock, furniture) — recreate using IA behaviours
- **Components** — use IA-specific item properties
- **Sounds** — check sounds.json references in resourcepack folder

## Warnings (${warnings.length})
${warnings.map((w) => `- ${w}`).join("\n") || "None!"}
`;
}
