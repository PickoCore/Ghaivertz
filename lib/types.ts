// ============================================================
// Ghaivert — Core Types
// Covers ItemsAdder, Nexo, Oraxen item structures
// ============================================================

export type PluginType = "itemsadder" | "nexo" | "oraxen";

export interface ConversionOptions {
  from: PluginType;
  to: PluginType;
  fromVersion: string;
  toVersion: string;
}

export interface ConversionResult {
  success: boolean;
  zipBlob?: Blob;
  warnings: string[];
  errors: string[];
  stats: {
    totalItems: number;
    convertedItems: number;
    skippedItems: number;
    filesProcessed: number;
  };
}

// ─── ItemsAdder ───────────────────────────────────────────
export interface IAItemResource {
  material?: string;
  generate?: boolean;
  textures?: string[];
  model_path?: string;
  /** Only on armor */
  color?: string;
}

export interface IAItem {
  enabled?: boolean;
  display_name?: string;
  permission?: string;
  lore?: string[];
  resource?: IAItemResource;
  durability?: { max_custom_durability?: number };
  attribute_modifiers?: Record<string, unknown>;
  specific_properties?: Record<string, unknown>;
  enchants?: string[];
  events?: Record<string, unknown>;
  behaviours?: Record<string, unknown>;
  nbt?: string;
  [key: string]: unknown;
}

export interface IAConfig {
  info: { namespace: string };
  items?: Record<string, IAItem>;
  [key: string]: unknown;
}

// ─── Nexo ─────────────────────────────────────────────────
export interface NexoPack {
  /** Single texture path: "namespace:path/name" or just "path/name" */
  texture?: string;
  /** Multi-texture map (for blocks) */
  textures?: Record<string, string> | string[];
  parent_model?: string;
  model?: string;
  generate_model?: boolean;
  /** 1.21.4+ ItemModel path */
  item_model?: string;
}

export interface NexoItem {
  material?: string;
  itemname?: string;
  displayname?: string; // legacy alias
  lore?: string[];
  Pack?: NexoPack;
  Mechanics?: Record<string, unknown>;
  Components?: Record<string, unknown>;
  [key: string]: unknown;
}

// ─── Oraxen ───────────────────────────────────────────────
export interface OraxenPack {
  generate_model?: boolean;
  parent_model?: string;
  textures?: string[] | Record<string, string>;
  model?: string;
  custom_model_data?: number;
  blocking_model?: string;
  pulling_models?: string[];
}

export interface OraxenItem {
  material?: string;
  displayname?: string;
  lore?: string[];
  Pack?: OraxenPack;
  Mechanics?: Record<string, unknown>;
  [key: string]: unknown;
}

// ─── Intermediate Representation ──────────────────────────
// Ghaivert converts everything through this IR first
export interface GhaivertItem {
  id: string;
  namespace: string;
  material: string;
  displayName?: string;
  lore?: string[];
  // Resource pack info
  generateModel: boolean;
  /** texture paths relative to namespace, e.g. "item/arcane_ring" */
  textures: string[] | Record<string, string>;
  /** path to pre-made model JSON, e.g. "item/mysterious_hood" */
  modelPath?: string;
  parentModel?: string;
  // Extra fields pass-through (plugin-specific, we keep as-is)
  extra: Record<string, unknown>;
  // Source info for warnings
  _source: PluginType;
}
