import { useSearchParams } from "react-router-dom";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type SortBy = "name" | "atk" | "hp";
type SortOrder = "asc" | "desc";

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "atk", label: "ATK" },
  { value: "hp", label: "HP" },
];

/**
 * SortControls component for sorting cards
 * Dropdown for sortBy (name, ATK, HP) and button for sortOrder (asc, desc)
 * Updates URL params
 * Requirements: 1.6
 */
export function SortControls() {
  const [searchParams, setSearchParams] = useSearchParams();

  const sortBy = (searchParams.get("sortBy") as SortBy) || "name";
  const sortOrder = (searchParams.get("sortOrder") as SortOrder) || "asc";

  const handleSortByChange = (value: SortBy) => {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("sortBy", value);
        return newParams;
      },
      { replace: true }
    );
  };

  const handleSortOrderToggle = () => {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("sortOrder", sortOrder === "asc" ? "desc" : "asc");
        return newParams;
      },
      { replace: true }
    );
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={sortBy} onValueChange={handleSortByChange}>
        <SelectTrigger className="w-[120px]">
          <ArrowUpDown className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={handleSortOrderToggle}
        title={sortOrder === "asc" ? "Ascending" : "Descending"}
      >
        {sortOrder === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
