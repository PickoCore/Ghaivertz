// ============================================================
// Ghaivert — Plugin Version Registry
// ============================================================

export interface PluginVersion {
  value: string;
  label: string;
  mcVersions: string; // supported MC versions
  notes?: string;
}

export const IA_VERSIONS: PluginVersion[] = [
  { value: "4.0.16", label: "4.0.16", mcVersions: "1.21 – 1.21.4", notes: "Latest stable" },
  { value: "4.0.10", label: "4.0.10", mcVersions: "1.21 – 1.21.1" },
  { value: "4.0.5",  label: "4.0.5",  mcVersions: "1.21" },
  { value: "4.0.0",  label: "4.0.0",  mcVersions: "1.21" },
  { value: "3.6.1",  label: "3.6.1",  mcVersions: "1.20.x" },
  { value: "3.5.0",  label: "3.5.0",  mcVersions: "1.20.x" },
  { value: "3.3.0",  label: "3.3.0",  mcVersions: "1.19.x – 1.20.x" },
];

export const NEXO_VERSIONS: PluginVersion[] = [
  { value: "0.7.0", label: "0.7.0", mcVersions: "1.21.3 – 1.21.4", notes: "Latest stable" },
  { value: "0.6.0", label: "0.6.0", mcVersions: "1.21.1 – 1.21.2" },
  { value: "0.5.0", label: "0.5.0", mcVersions: "1.21" },
  { value: "0.4.0", label: "0.4.0", mcVersions: "1.20.6 – 1.21" },
  { value: "0.3.0", label: "0.3.0", mcVersions: "1.20.4 – 1.20.6" },
];

export const ORAXEN_VERSIONS: PluginVersion[] = [
  { value: "2.0.0", label: "2.0.0", mcVersions: "1.21.x", notes: "Latest stable" },
  { value: "1.190.0", label: "1.190.0", mcVersions: "1.20.x – 1.21" },
  { value: "1.180.0", label: "1.180.0", mcVersions: "1.20.x" },
  { value: "1.170.0", label: "1.170.0", mcVersions: "1.20.x" },
  { value: "1.160.0", label: "1.160.0", mcVersions: "1.19.x – 1.20.x" },
];

export type PluginType = "itemsadder" | "nexo" | "oraxen";

export const PLUGIN_META: Record<PluginType, { name: string; color: string; accent: string; icon: string; versions: PluginVersion[] }> = {
  itemsadder: {
    name: "ItemsAdder",
    color: "#f97316",
    accent: "#fdba74",
    icon: "🔶",
    versions: IA_VERSIONS,
  },
  nexo: {
    name: "Nexo",
    color: "#22d3ee",
    accent: "#67e8f9",
    icon: "🔷",
    versions: NEXO_VERSIONS,
  },
  oraxen: {
    name: "Oraxen",
    color: "#a78bfa",
    accent: "#c4b5fd",
    icon: "🔮",
    versions: ORAXEN_VERSIONS,
  },
};

export const SUPPORTED_ROUTES: { from: PluginType; to: PluginType }[] = [
  { from: "itemsadder", to: "nexo" },
  { from: "nexo", to: "itemsadder" },
  { from: "oraxen", to: "itemsadder" },
];

export function isRouteSupported(from: PluginType, to: PluginType): boolean {
  return SUPPORTED_ROUTES.some((r) => r.from === from && r.to === to);
}
