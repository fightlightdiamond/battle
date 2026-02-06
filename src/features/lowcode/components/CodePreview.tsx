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
import {
  generateFormComponent,
  generateCardComponent,
  generateListComponent,
} from "../services/componentGenerator";
import { generateListPage } from "../services/pageGenerator";
import { generateService } from "../services/serviceGenerator";

type TabType =
  | "interface"
  | "schema"
  | "form"
  | "card"
  | "list"
  | "listPage"
  | "service";

interface CodePreviewProps {
  entityDefinition: EntityDefinition;
}

/**
 * CodePreview component displays generated TypeScript code
 * Provides tabs for: Interface, Schema, Form, Card, List, ListPage, Service
 * Includes copy to clipboard functionality
 * Requirements: 5.1, 5.2, 5.3
 */
export function CodePreview({ entityDefinition }: CodePreviewProps) {
  const [copiedTab, setCopiedTab] = useState<TabType | null>(null);

  // Generate all code types
  const interfaceCode = generateInterface(entityDefinition);
  const schemaCode = generateZodSchema(entityDefinition);
  const formCode = generateFormComponent(entityDefinition);
  const cardCode = generateCardComponent(entityDefinition);
  const listCode = generateListComponent(entityDefinition);
  const listPageCode = generateListPage(entityDefinition);
  const serviceCode = generateService(entityDefinition);

  const copyToClipboard = async (code: string, tab: TabType) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedTab(tab);
      setTimeout(() => setCopiedTab(null), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const tabs: { value: TabType; label: string; code: string }[] = [
    { value: "interface", label: "Interface", code: interfaceCode },
    { value: "schema", label: "Schema", code: schemaCode },
    { value: "form", label: "Form", code: formCode },
    { value: "card", label: "Card", code: cardCode },
    { value: "list", label: "List", code: listCode },
    { value: "listPage", label: "ListPage", code: listPageCode },
    { value: "service", label: "Service", code: serviceCode },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Generated Code</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="interface">
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent
              key={tab.value}
              value={tab.value}
              className="space-y-2"
            >
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(tab.code, tab.value)}
                >
                  {copiedTab === tab.value ? (
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
              <CodeBlock code={tab.code} language="typescript" />
            </TabsContent>
          ))}
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
    <pre className="bg-muted rounded-md p-4 overflow-x-auto text-sm max-h-96">
      <code className="text-foreground font-mono whitespace-pre">{code}</code>
    </pre>
  );
}
