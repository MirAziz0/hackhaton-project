// Chart palette. The series colours were checked for colour-blind separation and contrast
// on a white surface; keep the order fixed so a series never changes colour between charts.
export const CHART_COLORS = {
  revenue: "#6d3df5",
  costs: "#0ea5a4",
  grid: "#ebe9f3",
  axis: "#6b6b80",
  other: "#9ca3af",
};

// Categorical slots for the expense breakdown, assigned in this fixed order. Two of them are
// below 3:1 contrast on white, so every bar is always shown with its name and value as text.
export const CATEGORY_COLORS = ["#7c4dff", "#0ea5c6", "#ec4899", "#16a34a", "#2563eb", "#f59e0b"];
