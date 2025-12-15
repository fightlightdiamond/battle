import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { DailyBonusNotification } from "./features/betting/components/DailyBonusNotification";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

interface AppProps {
  children: ReactNode;
}

/**
 * App Component
 * Requirements: 1.1, 1.4 - Check and claim daily bonus on first load
 */
function App({ children }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        {children}
        {/* Daily bonus check on app load - Requirements: 1.1, 1.4 */}
        <DailyBonusNotification autoCheck />
        <Toaster position="top-right" richColors />
      </div>
    </QueryClientProvider>
  );
}

export default App;
