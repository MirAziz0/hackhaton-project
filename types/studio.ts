import type { Branding, BusinessPlan, FinancialForecast, LocationSuggestion } from "@/types/database";

// A generated (or saved) business as shown on the Studio results page.
export interface StudioBusiness {
  name: string;
  idea_text: string;
  plan: BusinessPlan;
  financial_forecast: FinancialForecast;
  locations: LocationSuggestion[];
  branding: Branding;
}

export interface BrandingImages {
  logo_urls: string[];
  banner_url: string | null;
  // True when the images are generated SVG placeholders rather than AI images.
  placeholder: boolean;
}
