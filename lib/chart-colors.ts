// Chart palette. The series colours were checked for colour-blind separation and contrast
// on a white surface; keep the order fixed so a series never changes colour between charts.
export const CHART_COLORS = {
  revenue: "#4f46e5",
  costs: "#d97706",
  grid: "#e2e8f0",
  axis: "#64748b",
  other: "#94a3b8",
};

// Categorical slots for the expense donut, assigned in this fixed order. Three of them are
// below 3:1 contrast on white, so the donut always ships with a labelled legend beside it.
export const CATEGORY_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#4a3aa7"];
