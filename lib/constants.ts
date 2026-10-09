import type { LookingFor, Stage, Track } from "@/types/database";

export const APP_NAME = "Growenta";

// Public demo account created by supabase/seed.sql.
export const DEMO_EMAIL = "demo@launchlens.az";
export const DEMO_PASSWORD = "demo12345";

export const TRACKS: { value: Track; label: string; description: string }[] = [
  { value: "cosmetics", label: "Kosmetika", description: "Gözəllik və baxım məhsulları" },
  { value: "food", label: "Qida", description: "Kafe, restoran, qida istehsalı" },
  { value: "clothing", label: "Geyim", description: "Geyim və aksesuarlar" },
  { value: "it_services", label: "IT xidmətləri", description: "Proqram təminatı, rəqəmsal xidmətlər" },
  { value: "education", label: "Təhsil", description: "Kurslar, təlimlər, repetitorluq" },
  { value: "other", label: "Digər", description: "Başqa sahə" },
];

export const STAGES: { value: Stage; label: string; description: string }[] = [
  { value: "idea", label: "Yalnız ideyam var", description: "Hələ plan qurmamışam" },
  { value: "plan_ready", label: "Planım hazırdır", description: "Biznes planımı yoxlatmaq istəyirəm" },
  { value: "operating", label: "Artıq fəaliyyət göstərirəm", description: "Gəlir və xərclərimi izləmək istəyirəm" },
];

export const BUDGET_RANGES: { value: string; label: string }[] = [
  { value: "under_5k", label: "5 000 ₼-dək" },
  { value: "5k_20k", label: "5 000 – 20 000 ₼" },
  { value: "20k_50k", label: "20 000 – 50 000 ₼" },
  { value: "50k_100k", label: "50 000 – 100 000 ₼" },
  { value: "over_100k", label: "100 000 ₼-dan çox" },
];

export const BAKU_DISTRICTS = [
  "Nəsimi",
  "Yasamal",
  "Səbail",
  "Nərimanov",
  "Xətai",
  "Binəqədi",
  "Nizami",
  "Sabunçu",
  "Suraxanı",
  "Xəzər",
  "Qaradağ",
];

export const REGIONS = [
  "Gəncə",
  "Sumqayıt",
  "Mingəçevir",
  "Lənkəran",
  "Şəki",
  "Quba",
  "Şirvan",
  "Naxçıvan",
];

export const ONLINE_LOCATION = "Onlayn";

export const LOOKING_FOR: { value: LookingFor; label: string }[] = [
  { value: "partner", label: "Tərəfdaş" },
  { value: "investor", label: "İnvestor" },
  { value: "supplier", label: "Təchizatçı" },
  { value: "mentor", label: "Mentor" },
  { value: "customers", label: "Müştərilər" },
];

export const STAGE_HOME: Record<Stage, string> = {
  idea: "/studio",
  plan_ready: "/analysis",
  operating: "/dashboard",
};

export function trackLabel(value: string | null | undefined) {
  return TRACKS.find((t) => t.value === value)?.label ?? "—";
}

export function stageLabel(value: string | null | undefined) {
  return STAGES.find((s) => s.value === value)?.label ?? "—";
}

export function budgetLabel(value: string | null | undefined) {
  return BUDGET_RANGES.find((b) => b.value === value)?.label ?? "—";
}

export function lookingForLabel(value: string) {
  return LOOKING_FOR.find((l) => l.value === value)?.label ?? value;
}

export function homeForStage(stage: string | null | undefined) {
  return STAGE_HOME[(stage as Stage) ?? "idea"] ?? "/studio";
}
