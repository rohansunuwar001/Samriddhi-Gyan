// src/pages/admin/BlogImporter.jsx
//
// Admin-only page that lets you upload blogSeedData.js content as JSON
// directly to the live database — no server shell access needed.
//
// HOW TO USE:
// 1. Open blogSeedData.js in any text editor.
// 2. Copy everything AFTER the export keywords into a .json file like this:
//    {
//      "categories": [...],
//      "authors": [...],
//      "articles": [...]
//    }
//    OR just paste that JSON directly into the text area below.
// 3. Click "Import to Database".

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useImportBlogDataMutation } from "@/features/api/blogImportApi";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  FileJson,
  Loader2,
  Upload,
} from "lucide-react";

// The template users can download as a starting point
const JSON_TEMPLATE = JSON.stringify(
  {
    categories: ["Development", "Marketing"],
    authors: [
      {
        name: "Jane Doe",
        avatar: "https://i.pravatar.cc/150?u=janedoe",
        bio: "Short author bio here.",
      },
    ],
    articles: [
      {
        title: "Your Article Title",
        category: "Development",
        author: "Jane Doe",
        featuredImage: "https://images.unsplash.com/photo-example",
        popular: false,
        content: [
          { type: "paragraph", text: "Opening paragraph text." },
          { type: "heading", level: 2, text: "A Section Heading" },
          { type: "paragraph", text: "More content here." },
        ],
      },
    ],
  },
  null,
  2
);

const ResultBadge = ({ count, label, variant = "default" }) => (
  <div className="flex items-center justify-between py-2 border-b last:border-0">
    <span className="text-lg text-muted-foreground">{label}</span>
    <Badge variant={variant}>{count}</Badge>
  </div>
);

const BlogImporter = () => {
  const [jsonText, setJsonText] = useState("");
  const [parseError, setParseError] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const [importBlogData, { isLoading }] = useImportBlogDataMutation();

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".json")) {
      toast.error("Please upload a .json file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonText(event.target.result);
      setParseError(null);
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([JSON_TEMPLATE], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "blogSeedData.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    setParseError(null);
    setImportResult(null);

    // 1. Parse and validate JSON
    let payload;
    try {
      payload = JSON.parse(jsonText);
    } catch {
      setParseError("Invalid JSON — check for missing commas, quotes, or brackets.");
      return;
    }

    if (!payload.categories || !payload.authors || !payload.articles) {
      setParseError(
        'JSON must have three top-level keys: "categories", "authors", and "articles".'
      );
      return;
    }

    // 2. Send to backend
    try {
      const result = await importBlogData(payload).unwrap();
      setImportResult(result);
      toast.success(result.message);
    } catch (err) {
      const msg = err?.data?.message || "Import failed. Check the console for details.";
      toast.error(msg);
      setImportResult({ success: false, message: msg, results: err?.data?.results });
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50 min-h-screen">
      <header>
        <h2 className="text-5xl font-light tracking-tight">Blog Data Importer</h2>
        <p className="text-muted-foreground">
          Upload your blog seed JSON to populate the live database. Safe to
          re-run — existing entries are updated, not duplicated.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: instructions + controls ─────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">How to use</CardTitle>
            </CardHeader>
            <CardContent className="text-lg text-muted-foreground space-y-3">
              <p>
                <span className="font-light text-foreground">1.</span> Download
                the template below and fill it with your real content, or convert
                your existing <code className="bg-muted px-1 rounded">blogSeedData.js</code>{" "}
                to JSON format.
              </p>
              <p>
                <span className="font-light text-foreground">2.</span> Upload
                the .json file or paste the JSON directly into the editor.
              </p>
              <p>
                <span className="font-light text-foreground">3.</span> Click{" "}
                <span className="font-light text-foreground">
                  Import to Database
                </span>
                . Results appear on the right.
              </p>
              <p className="text-base pt-2 border-t">
                <span className="font-light text-foreground">Note:</span>{" "}
                Article <code className="bg-muted px-1 rounded">author</code> and{" "}
                <code className="bg-muted px-1 rounded">category</code> fields
                must match the names in your{" "}
                <code className="bg-muted px-1 rounded">authors</code> and{" "}
                <code className="bg-muted px-1 rounded">categories</code> arrays
                exactly (case-sensitive).
              </p>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleDownloadTemplate}
          >
            <FileJson className="mr-2 h-4 w-4" />
            Download JSON template
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload .json file
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* ── Right: editor + results ────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">JSON editor</CardTitle>
              <CardDescription>
                Paste or edit your blog seed JSON here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setParseError(null);
                  setImportResult(null);
                }}
                placeholder={`{\n  "categories": [],\n  "authors": [],\n  "articles": []\n}`}
                rows={20}
                className="w-full font-mono text-base border rounded-md p-3 bg-gray-950 text-green-400 resize-y focus:outline-none focus:ring-2 focus:ring-purple-600"
              />

              {parseError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Parse error</AlertTitle>
                  <AlertDescription>{parseError}</AlertDescription>
                </Alert>
              )}

              <Button
                className="w-full bg-purple-700 hover:bg-purple-800"
                onClick={handleImport}
                disabled={isLoading || !jsonText.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  "Import to Database"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results card */}
          {importResult && (
            <Card className={importResult.success ? "border-green-300" : "border-red-300"}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  {importResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  {importResult.success ? "Import successful" : "Import failed"}
                </CardTitle>
                <CardDescription>{importResult.message}</CardDescription>
              </CardHeader>
              {importResult.results && (
                <CardContent className="space-y-1">
                  <ResultBadge
                    label="Categories upserted"
                    count={importResult.results.categories}
                    variant="secondary"
                  />
                  <ResultBadge
                    label="Authors upserted"
                    count={importResult.results.authors}
                    variant="secondary"
                  />
                  <ResultBadge
                    label="Articles created"
                    count={importResult.results.articlesCreated}
                    variant="default"
                  />
                  <ResultBadge
                    label="Articles updated"
                    count={importResult.results.articlesUpdated}
                    variant="outline"
                  />
                  {importResult.results.skipped?.length > 0 && (
                    <div className="pt-2">
                      <p className="text-lg font-extralight text-red-600 mb-1">
                        Skipped ({importResult.results.skipped.length}):
                      </p>
                      <ul className="space-y-1">
                        {importResult.results.skipped.map((msg, i) => (
                          <li key={i} className="text-base text-muted-foreground">
                            • {msg}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogImporter;
