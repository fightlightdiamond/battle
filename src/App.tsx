import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FloatingMenu } from "./components/FloatingMenu";

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

function App({ children }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        {children}
        <FloatingMenu />
      </div>
    </QueryClientProvider>
  );
}

export default App;
