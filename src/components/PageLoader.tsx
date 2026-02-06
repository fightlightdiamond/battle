import { Loader2 } from "lucide-react";

/**
 * Loading fallback component for lazy loaded pages
 */
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
