export type Track = "cosmetics" | "food" | "clothing" | "it_services" | "education" | "other";
export type Stage = "idea" | "plan_ready" | "operating";
export type LookingFor = "partner" | "investor" | "supplier" | "mentor" | "customers";
export type TransactionType = "income" | "expense";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  track: Track | null;
  stage: Stage | null;
  city: string | null;
  budget_range: string | null;
  products: string | null;
  target_customer: string | null;
  bio: string | null;
  looking_for: LookingFor[];
  onboarding_completed: boolean;
  created_at: string;
}

export interface BusinessPlan {
  summary: string;
  products: { name: string; description: string; price_azn: number }[];
  target_audience: string;
  pricing_strategy: string;
  marketing_plan: string[];
  roadmap: { month: number; title: string; tasks: string[] }[];
  extra_ideas?: {
    campaigns: string[];
    social_posts: string[];
    popup_store: string;
  };
}

export interface FinancialForecast {
  startup_costs: { item: string; amount: number }[];
  monthly_costs: { item: string; amount: number }[];
  monthly_projection: { month: number; revenue: number; costs: number }[];
  // null when break-even is not reached within the projected months
  break_even_month: number | null;
}

export interface LocationSuggestion {
  name: string;
  lat: number;
  lng: number;
  reason: string;
  estimated_rent_azn: number;
  fit_score: number;
}

export interface Branding {
  name_ideas: string[];
  slogans: string[];
  logo_urls: string[];
  banner_url: string | null;
  visual_style?: { style: string; colors: string[]; logo_concept: string };
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  idea_text: string | null;
  plan: BusinessPlan | null;
  financial_forecast: FinancialForecast | null;
  locations: LocationSuggestion[] | null;
  branding: Branding | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  business_id: string;
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  note: string | null;
  created_at: string;
}

export interface MarketData {
  id: string;
  sector: string;
  region: string;
  metric: string;
  value: number;
  unit: string | null;
  year: number | null;
  source_name: string | null;
  source_url: string | null;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}
