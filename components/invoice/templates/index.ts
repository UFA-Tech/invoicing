import { TemplateClassic } from "./TemplateClassic";
import { TemplateModern } from "./TemplateModern";
import { TemplateMinimal } from "./TemplateMinimal";
import { TemplateBold } from "./TemplateBold";
import { TemplateElegant } from "./TemplateElegant";

export const TEMPLATES = {
  classic: TemplateClassic,
  modern: TemplateModern,
  minimal: TemplateMinimal,
  bold: TemplateBold,
  elegant: TemplateElegant,
} as const;

export type TemplateKey = keyof typeof TEMPLATES;

export const TEMPLATE_META: { key: TemplateKey; name: string; description: string; colors: string[] }[] = [
  { key: "classic", name: "Classic", description: "Bersih dan profesional, cocok untuk semua jenis bisnis", colors: ["#0f172a", "#f1f5f9", "#64748b"] },
  { key: "modern", name: "Modern", description: "Panel biru elegan di sisi kiri dengan tampilan kontemporer", colors: ["#1e3a8a", "#1d4ed8", "#dbeafe"] },
  { key: "minimal", name: "Minimal", description: "Tipografi simpel tanpa warna berlebihan, sangat bersih", colors: ["#111827", "#6b7280", "#f3f4f6"] },
  { key: "bold", name: "Bold", description: "Header gelap dramatis dengan aksen amber yang mencolok", colors: ["#0f172a", "#f59e0b", "#1e293b"] },
  { key: "elegant", name: "Elegant", description: "Aksen teal elegan dengan sentuhan modern yang mewah", colors: ["#0d9488", "#ccfbf1", "#134e4a"] },
];

export function getTemplate(key: string | null | undefined) {
  return TEMPLATES[(key as TemplateKey) ?? "classic"] ?? TemplateClassic;
}

export { TemplateClassic, TemplateModern, TemplateMinimal, TemplateBold, TemplateElegant };
