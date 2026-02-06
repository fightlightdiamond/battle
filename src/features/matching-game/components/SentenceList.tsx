/**
 * SentenceList - List of sentences with CRUD actions
 */

import { useState } from "react";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Sentence, SentenceDifficulty } from "../types";

interface SentenceListProps {
  sentences: Sentence[];
  isLoading?: boolean;
  onEdit: (sentence: Sentence) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

const difficultyColors: Record<SentenceDifficulty, string> = {
  easy: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  hard: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function SentenceList({
  sentences,
  isLoading = false,
  onEdit,
  onDelete,
  onCreate,
}: SentenceListProps) {
  const [search, setSearch] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filter sentences
  const filtered = sentences.filter((s) => {
    const matchesSearch =
      s.english.toLowerCase().includes(search.toLowerCase()) ||
      s.vietnamese.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty =
      filterDifficulty === "all" || s.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const handleDeleteConfirm = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sentences Management</h2>
        <Button onClick={onCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Sentence
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search sentences..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[35%]">English</TableHead>
              <TableHead className="w-[35%]">Vietnamese</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No sentences found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((sentence) => (
                <TableRow key={sentence.id}>
                  <TableCell className="font-medium">
                    {sentence.english}
                  </TableCell>
                  <TableCell>{sentence.vietnamese}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={difficultyColors[sentence.difficulty]}
                    >
                      {sentence.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sentence.category && (
                      <Badge variant="secondary">{sentence.category}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(sentence)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(sentence.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>Total: {sentences.length}</span>
        <span>Showing: {filtered.length}</span>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sentence</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this sentence? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
