// ============================================================
// Ghaivert — ItemsAdder Parser
// Supports IA 4.0.0 - 4.0.16 (1.21 - 1.21.11)
// ============================================================

import JSZip from "jszip";
import yaml from "js-yaml";
import type { IAConfig, IAItem, GhaivertItem } from "../types";

export interface ParsedIAPack {
  items: GhaivertItem[];
  /** namespace → list of asset file paths (textures, models, sounds) */
  assets: Map<string, string[]>;
  /** original ZIP for asset extraction */
  zip: JSZip;
  warnings: string[];
}

/**
 * ItemsAdder ZIP structure:
 * contents/
 *   <namespace>/
 *     configs/
 *       items*.yml / items/*.yml
 *     resourcepack/
 *       <namespace>/
 *         textures/
 *         models/
 *         sounds/
 */
export async function parseIAPack(zipFile: File): Promise<ParsedIAPack> {
  const zip = await JSZip.loadAsync(zipFile);
  const warnings: string[] = [];
  const items: GhaivertItem[] = [];
  const assets = new Map<string, string[]>();

  // ── Collect item YMLs ──────────────────────────────────
  const ymlFiles = Object.keys(zip.files).filter((p) =>
    p.match(/^contents\/[^/]+\/configs\/.*\.yml$/)
  );

  for (const filePath of ymlFiles) {
    const content = await zip.files[filePath].async("string");
    let parsed: IAConfig;

    try {
      parsed = yaml.load(content) as IAConfig;
    } catch (e) {
      warnings.push(`⚠️ Failed to parse YAML: ${filePath} — ${e}`);
      continue;
    }

    if (!parsed?.info?.namespace) continue;
    if (!parsed.items) continue;

    const namespace = parsed.info.namespace;

    for (const [itemId, item] of Object.entries(parsed.items)) {
      if (typeof item !== "object" || !item) continue;

      try {
        const gi = convertIAItemToIR(itemId, namespace, item as IAItem, warnings);
        items.push(gi);
      } catch (e) {
        warnings.push(`⚠️ Skipped item ${namespace}:${itemId} — ${e}`);
      }
    }
  }

  // ── Collect asset paths ────────────────────────────────
  for (const filePath of Object.keys(zip.files)) {
    if (!filePath.startsWith("contents/")) continue;
    const parts = filePath.split("/");
    if (parts.length < 3) continue;
    const namespace = parts[1];
    if (filePath.includes("/resourcepack/")) {
      if (!assets.has(namespace)) assets.set(namespace, []);
      assets.get(namespace)!.push(filePath);
    }
  }

  return { items, assets, zip, warnings };
}

function convertIAItemToIR(
  itemId: string,
  namespace: string,
  item: IAItem,
  warnings: string[]
): GhaivertItem {
  const res = item.resource ?? {};
  const material = res.material ?? "PAPER";
  const generateModel = res.generate ?? false;

  let textures: string[] | Record<string, string> = [];
  let modelPath: string | undefined;
  let parentModel: string | undefined;

  if (generateModel) {
    // IA textures array → e.g. ["item/arcane_ring"]
    textures = (res.textures ?? []).map((t) => {
      // IA stores texture paths without namespace prefix inside resourcepack
      // e.g. "item/arcane_ring" → file at resourcepack/<namespace>/textures/item/arcane_ring.png
      return t;
    });
    // IA default parent depends on material
    parentModel = guessParentModelFromMaterial(material);
  } else if (res.model_path) {
    // Pre-made model JSON
    modelPath = res.model_path;
    generateModel === false;
  } else if (!generateModel && !res.model_path) {
    // IA armor/special: generate: false with no model_path = uses auto-generated armor texture
    warnings.push(
      `⚠️ Item ${namespace}:${itemId} has generate:false and no model_path — may be armor or special type. Manual review needed.`
    );
  }

  // Strip resource and info from extra (plugin-specific)
  const { resource, enabled, ...rest } = item;
  void resource; void enabled;

  return {
    id: itemId,
    namespace,
    material,
    displayName: item.display_name,
    lore: item.lore,
    generateModel,
    textures,
    modelPath,
    parentModel,
    extra: rest,
    _source: "itemsadder",
  };
}

/**
 * Guess item/handheld vs item/generated based on material name.
 * This is what IA does internally.
 */
function guessParentModelFromMaterial(material: string): string {
  const handheldMaterials = [
    "SWORD", "AXE", "PICKAXE", "SHOVEL", "HOE", "BOW", "CROSSBOW",
    "ROD", "TRIDENT", "MACE", "SPADE",
  ];
  const upper = material.toUpperCase();
  if (handheldMaterials.some((m) => upper.includes(m))) return "item/handheld";
  return "item/generated";
}
