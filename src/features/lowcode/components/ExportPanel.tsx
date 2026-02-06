import { useState } from "react";
import { Download, Copy, Check, FolderTree, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { EntityDefinition } from "../types/entityDefinition";
import {
  generateFeatureFiles,
  generateRouteConfig,
  type GeneratedFile,
} from "../services/featureExporter";

interface ExportPanelProps {
  entityDefinition: EntityDefinition;
}

/**
 * ExportPanel component for exporting generated feature files
 * Shows file structure preview, export button, and route config
 * Requirements: 4.6, 4.7, 6.1
 */
export function ExportPanel({ entityDefinition }: ExportPanelProps) {
  const [copiedRoute, setCopiedRoute] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const files = generateFeatureFiles(entityDefinition);
  const routeConfig = generateRouteConfig(entityDefinition);

  const isValidEntity =
    entityDefinition.name && entityDefinition.fields.length > 0;

  const copyRouteConfig = async () => {
    try {
      await navigator.clipboard.writeText(routeConfig);
      setCopiedRoute(true);
      setTimeout(() => setCopiedRoute(false), 2000);
    } catch (err) {
      console.error("Failed to copy route config:", err);
    }
  };

  const copyAllFiles = async () => {
    try {
      const allContent = files
        .map((f) => `// ===== ${f.path} =====\n\n${f.content}`)
        .join("\n\n");
      await navigator.clipboard.writeText(allContent);
      setCopiedAll(true);
      setExportStatus({
        type: "success",
        message: `Copied ${files.length} files to clipboard!`,
      });
      setTimeout(() => {
        setCopiedAll(false);
        setExportStatus({ type: null, message: "" });
      }, 3000);
    } catch {
      setExportStatus({
        type: "error",
        message: "Failed to copy files to clipboard",
      });
    }
  };

  const downloadAsZip = async () => {
    try {
      // Create a simple text file with all content for download
      const allContent = files
        .map((f) => `// ===== ${f.path} =====\n\n${f.content}`)
        .join("\n\n");

      const blob = new Blob([allContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${entityDefinition.name.toLowerCase()}-feature.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportStatus({
        type: "success",
        message: `Downloaded ${files.length} files!`,
      });
      setTimeout(() => setExportStatus({ type: null, message: "" }), 3000);
    } catch {
      setExportStatus({
        type: "error",
        message: "Failed to download files",
      });
    }
  };

  if (!isValidEntity) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Export Feature
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Define an entity name and at least one field to enable export.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FolderTree className="h-5 w-5" />
          Export Feature
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="files">
          <TabsList className="mb-4">
            <TabsTrigger value="files">
              <FolderTree className="h-4 w-4 mr-1" />
              Files ({files.length})
            </TabsTrigger>
            <TabsTrigger value="routes">
              <Route className="h-4 w-4 mr-1" />
              Routes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-4">
            {/* File Structure Preview */}
            <ScrollArea className="h-48 rounded-md border p-4">
              <FileTree files={files} />
            </ScrollArea>

            {/* Export Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={copyAllFiles}
              >
                {copiedAll ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All
                  </>
                )}
              </Button>
              <Button className="flex-1" onClick={downloadAsZip}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="routes" className="space-y-4">
            {/* Route Config Preview */}
            <div className="relative">
              <pre className="bg-muted rounded-md p-4 overflow-x-auto text-sm max-h-48">
                <code className="text-foreground font-mono whitespace-pre">
                  {routeConfig}
                </code>
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={copyRouteConfig}
              >
                {copiedRoute ? (
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
            <p className="text-sm text-muted-foreground">
              Add these routes to your main.tsx file to integrate the new
              feature.
            </p>
          </TabsContent>
        </Tabs>

        {/* Status Message */}
        {exportStatus.type && (
          <div
            className={`text-sm p-2 rounded ${
              exportStatus.type === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}
          >
            {exportStatus.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * FileTree component displays the generated file structure
 */
function FileTree({ files }: { files: GeneratedFile[] }) {
  // Group files by directory
  const filesByDir = files.reduce(
    (acc, file) => {
      const parts = file.path.split("/");
      const dir = parts.slice(0, -1).join("/");
      if (!acc[dir]) {
        acc[dir] = [];
      }
      acc[dir].push(parts[parts.length - 1]);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  // Sort directories
  const sortedDirs = Object.keys(filesByDir).sort();

  return (
    <div className="font-mono text-sm space-y-1">
      {sortedDirs.map((dir) => (
        <div key={dir}>
          <div className="text-muted-foreground">{dir}/</div>
          {filesByDir[dir].map((file) => (
            <div key={`${dir}/${file}`} className="pl-4 text-foreground">
              └── {file}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
