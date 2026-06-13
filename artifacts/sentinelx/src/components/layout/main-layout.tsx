import { Sidebar } from "./sidebar";
import { NeuralBackground } from "./neural-background";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      <NeuralBackground />
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden z-10 relative bg-transparent">
        {children}
      </main>
    </div>
  );
}

