// ============================================================
// Ghaivert — IA → Nexo Converter
// IA 4.0.x → Nexo (1.21.1 - 1.21.11)
// ============================================================

import JSZip from "jszip";
import yaml from "js-yaml";
import type { GhaivertItem, NexoItem, NexoPack, ConversionResult } from "../types";
import type { ParsedIAPack } from "./ia-parser";

export async function convertIAToNexo(
  parsed: ParsedIAPack,
  toVersion: string
): Promise<ConversionResult> {
  const warnings = [...parsed.warnings];
  const errors: string[] = [];
  const outZip = new JSZip();
  let convertedItems = 0;
  let skippedItems = 0;

  // ── 1. Convert item YMLs ───────────────────────────────
  // Group items by namespace
  const byNamespace = new Map<string, GhaivertItem[]>();
  for (const item of parsed.items) {
    if (!byNamespace.has(item.namespace)) byNamespace.set(item.namespace, []);
    byNamespace.get(item.namespace)!.push(item);
  }

  for (const [namespace, items] of Array.from(byNamespace)) {
    const nexoItems: Record<string, NexoItem> = {};

    for (const item of items) {
      try {
        nexoItems[item.id] = convertItemToNexo(item, namespace, toVersion, warnings);
        convertedItems++;
      } catch (e) {
        errors.push(`❌ Failed to convert ${namespace}:${item.id} — ${e}`);
        skippedItems++;
      }
    }

    // Write to Nexo/items/<namespace>.yml
    const ymlContent = yaml.dump(nexoItems, {
      lineWidth: 200,
      quotingType: '"',
    });
    outZip.file(`Nexo/items/${namespace}.yml`, ymlContent);
  }

  // ── 2. Copy assets with path remapping ────────────────
  // IA: contents/<ns>/resourcepack/<ns>/textures/item/name.png
  // Nexo: Nexo/pack/assets/<ns>/textures/item/name.png
  for (const [namespace, assetPaths] of Array.from(parsed.assets)) {
    for (const assetPath of assetPaths) {
      // assetPath = "contents/<ns>/resourcepack/<ns>/textures/..."
      const resourcepackIdx = assetPath.indexOf("/resourcepack/");
      if (resourcepackIdx === -1) continue;

      const afterResourcepack = assetPath.slice(resourcepackIdx + "/resourcepack/".length);
      // afterResourcepack = "<ns>/textures/..." or "<ns>/models/..." or "<ns>/sounds/..."
      // We keep this structure: Nexo/pack/assets/<afterResourcepack>
      const nexoAssetPath = `Nexo/pack/assets/${afterResourcepack}`;

      try {
        const fileData = await parsed.zip.files[assetPath].async("uint8array");
        outZip.file(nexoAssetPath, fileData);
      } catch (e) {
        warnings.push(`⚠️ Could not copy asset ${assetPath}: ${e}`);
      }
    }
  }

  // ── 3. Generate README ─────────────────────────────────
  const readme = generateNexoReadme(toVersion, warnings);
  outZip.file("README-GHAIVERT.md", readme);

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
      filesProcessed: Object.values(parsed.zip.files).filter((f) => !f.dir).length,
    },
  };
}

function convertItemToNexo(
  item: GhaivertItem,
  namespace: string,
  toVersion: string,
  warnings: string[]
): NexoItem {
  const pack: NexoPack = {};

  if (item.generateModel) {
    // IA: generate: true, textures: ["item/arcane_ring"]
    // Nexo: Pack.texture: "namespace:item/arcane_ring" (single) or textures: (multi)
    const textures = Array.isArray(item.textures) ? item.textures : Object.values(item.textures);

    if (textures.length === 1) {
      // Nexo prefers single `texture` field
      pack.texture = `${namespace}:${stripPng(textures[0])}`;
    } else if (textures.length > 1) {
      // multi-texture → map with indexed keys or keep as array
      // Nexo accepts textures as a map (for blocks) or we just list them
      pack.textures = textures.map((t) => `${namespace}:${stripPng(t)}`);
    }

    pack.parent_model = item.parentModel ?? "item/generated";
  } else if (item.modelPath) {
    // IA: generate: false, model_path: "item/mysterious_hood"
    // Nexo: Pack.model: "namespace:item/mysterious_hood"
    pack.model = `${namespace}:${stripPng(item.modelPath)}`;
  } else {
    warnings.push(
      `⚠️ Item ${namespace}:${item.id}: no texture or model_path found, Pack section may be incomplete.`
    );
  }

  // Build Nexo item
  const nexoItem: NexoItem = {
    material: item.material,
    itemname: item.displayName ?? item.id,
    Pack: pack,
  };

  if (item.lore?.length) nexoItem.lore = item.lore;

  // Pass-through compatible extra fields
  const compatExtra = extractCompatExtra(item.extra, "nexo", warnings, item.id, namespace);
  Object.assign(nexoItem, compatExtra);

  return nexoItem;
}

/** Fields that map cleanly from IA extra to Nexo */
function extractCompatExtra(
  extra: Record<string, unknown>,
  target: "nexo" | "oraxen",
  warnings: string[],
  itemId: string,
  namespace: string
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const skip = ["display_name", "lore", "resource", "enabled"];
  const unsupported = ["behaviours", "events", "specific_properties", "nbt"];

  for (const [key, value] of Object.entries(extra)) {
    if (skip.includes(key)) continue;
    if (unsupported.includes(key)) {
      warnings.push(
        `⚠️ ${namespace}:${itemId} — field '${key}' is IA-specific and was NOT converted. Manual migration needed.`
      );
      continue;
    }
    // attribute_modifiers, enchants, durability → pass through (Nexo/Oraxen use same-ish names)
    if (key === "attribute_modifiers") {
      out.AttributeModifiers = value; // Nexo uses PascalCase
      continue;
    }
    if (key === "durability") {
      // IA: durability.max_custom_durability → Nexo: Components.max_damage
      const dur = value as Record<string, unknown>;
      if (dur?.max_custom_durability) {
        out.Components = { max_damage: dur.max_custom_durability };
      }
      continue;
    }
    if (key === "enchants") {
      out.enchants = value;
      continue;
    }
    if (key === "permission") continue; // handled per-plugin
  }

  return out;
}

function stripPng(path: string): string {
  return path.replace(/\.png$/i, "");
}

function generateNexoReadme(version: string, warnings: string[]): string {
  return `# Converted by Ghaivert
**Target:** Nexo ${version}  
**Tool:** ghaivert.vercel.app  

## Installation
1. Drop the \`Nexo/\` folder into your \`plugins/\` directory
2. Restart your server or run \`/nexo reload\`
3. Check warnings below before going live

## ⚠️ Manual Review Required
The following fields are IA-specific and **could not be auto-converted**:
- \`behaviours\` (furniture, machinery, etc.) — recreate using Nexo Mechanics
- \`events\` — use Nexo's event system or compatible plugins
- \`specific_properties\` — use Nexo Components instead
- \`nbt\` — use Nexo Components.custom_data

## Warnings (${warnings.length})
${warnings.map((w) => `- ${w}`).join("\n") || "None!"}
`;
}
