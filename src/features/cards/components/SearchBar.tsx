import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "react-use";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  placeholder?: string;
  debounceMs?: number;
}

/**
 * SearchBar component with debounced search input
 * Updates URL search param via useSearchParams
 * Requirements: 1.5
 */
export function SearchBar({
  placeholder = "Search cards...",
  debounceMs = 300,
}: SearchBarProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFromUrl = searchParams.get("search") || "";
  const [inputValue, setInputValue] = useState(searchFromUrl);

  // Debounce search param update using react-use
  useDebounce(
    () => {
      if (inputValue === searchFromUrl) return;

      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          if (inputValue) {
            newParams.set("search", inputValue);
          } else {
            newParams.delete("search");
          }
          // Reset to page 1 when search changes
          newParams.set("page", "1");
          return newParams;
        },
        { replace: true }
      );
    },
    debounceMs,
    [inputValue]
  );

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}
