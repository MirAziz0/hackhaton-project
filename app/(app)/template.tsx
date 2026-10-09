// A template (unlike a layout) is re-created on every navigation, so the entrance animation
// defined by `.page-transition` in globals.css replays each time the user switches pages.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-transition">{children}</div>;
}
