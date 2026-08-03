export type SkinId = "clasico" | "neon" | "retro";

export const DEFAULT_SKIN: SkinId = "clasico";

export const SKINS: { id: SkinId; label: string }[] = [
  { id: "clasico", label: "CLÁSICO" },
  { id: "neon", label: "NEÓN" },
  { id: "retro", label: "RETRO" },
];

const SKIN_IDS = new Set<SkinId>(SKINS.map((s) => s.id));

/** Devuelve un SkinId válido; ante cualquier valor desconocido cae a DEFAULT_SKIN. */
export function normalizeSkin(value: unknown): SkinId {
  return typeof value === "string" && SKIN_IDS.has(value as SkinId)
    ? (value as SkinId)
    : DEFAULT_SKIN;
}
