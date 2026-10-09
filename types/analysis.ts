export interface FitScore {
  score: number;
  reason: string;
}

export interface AnalysisMarketFit {
  summary: string;
  baku: FitScore;
  regions: FitScore;
  online: FitScore;
  location_analysis: {
    assessment: string;
    alternatives: { name: string; reason: string }[];
  };
}

export interface Swot {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export type BudgetStatus = "low" | "ok" | "high";

export interface BudgetCheckItem {
  category: string;
  status: BudgetStatus;
  comment: string;
}

export interface Competitor {
  name: string;
  description: string;
  differentiation: string;
  // Reference id (e.g. "W2"), or null when the entry is the model's own estimate.
  source_id: string | null;
}

export type Priority = "high" | "medium" | "low";

export interface Recommendation {
  priority: Priority;
  title: string;
  detail: string;
}

export interface KeyFigure {
  label: string;
  value: string;
  // Reference id (e.g. "M3"), "PLAN" for a number quoted from the user's own plan,
  // or null when the value is an estimate ("təxmini").
  source_id: string | null;
}

export interface SourceReference {
  id: string;
  kind: "market_data" | "web";
  name: string;
  url: string | null;
  detail: string;
}

export interface AnalysisSources {
  figures: KeyFigure[];
  references: SourceReference[];
  web_search_used: boolean;
}

export interface Analysis {
  id: string;
  business_id: string;
  overall_score: number;
  market_fit: AnalysisMarketFit;
  swot: Swot;
  budget_check: BudgetCheckItem[];
  competitors: Competitor[];
  recommendations: Recommendation[];
  sources: AnalysisSources;
  created_at: string;
}

export type AnalysisPayload = Omit<Analysis, "id" | "business_id" | "created_at">;
