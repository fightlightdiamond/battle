/**
 * SentenceForm - Form for creating/editing sentences
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Sentence, SentenceFormInput } from "../types";

const formSchema = z.object({
  english: z.string().min(1, "English sentence is required").max(500),
  vietnamese: z.string().min(1, "Vietnamese translation is required").max(500),
  difficulty: z.enum(["easy", "medium", "hard"]),
  category: z.string().optional(),
});

interface SentenceFormProps {
  sentence?: Sentence;
  onSubmit: (data: SentenceFormInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SentenceForm({
  sentence,
  onSubmit,
  onCancel,
  isLoading = false,
}: SentenceFormProps) {
  const form = useForm<SentenceFormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      english: sentence?.english || "",
      vietnamese: sentence?.vietnamese || "",
      difficulty: sentence?.difficulty || "easy",
      category: sentence?.category || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="english"
          render={({ field }) => (
            <FormItem>
              <FormLabel>English Sentence</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter English sentence..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vietnamese"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vietnamese Translation</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Nhập bản dịch tiếng Việt..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Difficulty</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. greetings, food..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : sentence ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
