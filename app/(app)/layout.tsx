import TopNav from "@/components/TopNav";

// Shared by every page: the main menu stays on top, the page renders below it.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <TopNav />
      {children}
    </div>
  );
}
