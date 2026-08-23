import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import ThemeProvider from "@/components/ThemeProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppProvider>
        <ThemeProvider>
          <div className="min-h-screen bg-white text-slate-900 transition-all duration-500 dark:bg-[#17121F] dark:text-white">
            {children}
          </div>
        </ThemeProvider>
      </AppProvider>
    </AuthProvider>
  );
}
