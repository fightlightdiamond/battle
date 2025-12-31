import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EntityDefinition } from "../types/entityDefinition";
import {
  generateInterface,
  generateZodSchema,
} from "../services/codeGenerator";

interface CodePreviewProps {
  entityDefinition: EntityDefinition;
}

/**
 * CodePreview component displays generated TypeScript interface and Zod schema code
 * Provides tabs for switching between Interface and Schema views
 * Includes copy to clipboard functionality
 * Requirements: 2.1, 2.2, 2.4
 */
export function CodePreview({ entityDefinition }: CodePreviewProps) {
  const [copiedTab, setCopiedTab] = useState<"interface" | "schema" | null>(
    null,
  );

  const interfaceCode = generateInterface(entityDefinition);
  const schemaCode = generateZodSchema(entityDefinition);

  const copyToClipboard = async (code: string, tab: "interface" | "schema") => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedTab(tab);
      setTimeout(() => setCopiedTab(null), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Generated Code</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="interface">
          <TabsList className="mb-4">
            <TabsTrigger value="interface">Interface</TabsTrigger>
            <TabsTrigger value="schema">Schema</TabsTrigger>
          </TabsList>

          <TabsContent value="interface" className="space-y-2">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(interfaceCode, "interface")}
              >
                {copiedTab === "interface" ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <CodeBlock code={interfaceCode} language="typescript" />
          </TabsContent>

          <TabsContent value="schema" className="space-y-2">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(schemaCode, "schema")}
              >
                {copiedTab === "schema" ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <CodeBlock code={schemaCode} language="typescript" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface CodeBlockProps {
  code: string;
  language: string;
}

/**
 * Simple code block component with syntax highlighting styling
 */
function CodeBlock({ code }: CodeBlockProps) {
  return (
    <pre className="bg-muted rounded-md p-4 overflow-x-auto text-sm">
      <code className="text-foreground font-mono whitespace-pre">{code}</code>
    </pre>
  );
}
