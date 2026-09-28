/* eslint-disable react/prop-types */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Play,
  FileText,
  Code,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileCode,
  Plus,
  Trash2,
  Sliders,
  RefreshCw,
  UploadCloud,
  File,
  Copy,
  Check,
  Search,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  BarChart3,
  Terminal,
  RotateCcw,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useValidateCodeASTMutation,
  useCheckPlagiarismLSHMutation,
  useCrossComparePlagiarismMutation
} from "@/features/api/evaluationApi";

// Pre-seeded multi-language code templates
const LANGUAGE_SAMPLES = {
  javascript: `// AST Parser Playground - JavaScript
const totalCount = 10;
let cumulativeSum = 0;

for (let currentVal = 1; currentVal <= totalCount; currentVal++) {
  cumulativeSum = cumulativeSum + currentVal;
  logProgress("Summing item:", currentVal);
}

function logProgress(label, value) {
  return \`\${label} \${value}\`;
}
`,
  python: `# AST Parser Playground - Python
total_count = 10
cumulative_sum = 0

for current_val in range(1, total_count + 1):
    cumulative_sum += current_val
    print("Adding value:", current_val)

def log_progress(label, value):
    return f"{label} {value}"
`,
  java: `// AST Parser Playground - Java
public class Main {
    public static void main(String[] args) {
        int totalCount = 10;
        int cumulativeSum = 0;

        for (int currentVal = 1; currentVal <= totalCount; currentVal++) {
            cumulativeSum += currentVal;
            System.out.println("Adding: " + currentVal);
        }
    }

    public static String logProgress(String label, int value) {
        return label + " " + value;
    }
}
`,
  cpp: `// AST Parser Playground - C++
#include <iostream>
#include <string>

int main() {
    int totalCount = 10;
    int cumulativeSum = 0;

    for (int currentVal = 1; currentVal <= totalCount; currentVal++) {
        cumulativeSum += currentVal;
        std::cout << "Summing: " << currentVal << std::endl;
    }
    return 0;
}
`,
  go: `// AST Parser Playground - Go
package main

import "fmt"

func main() {
    totalCount := 10
    cumulativeSum := 0

    for currentVal := 1; currentVal <= totalCount; currentVal++ {
        cumulativeSum += currentVal
        fmt.Println("Adding:", currentVal)
    }
}
`,
  ruby: `# AST Parser Playground - Ruby
total_count = 10
cumulative_sum = 0

(1..total_count).each do |current_val|
  cumulative_sum += current_val
  puts "Adding value: #{current_val}"
end

def log_progress(label, value)
  "#{label} #{value}"
end
`,
  rust: `// AST Parser Playground - Rust
fn main() {
    let total_count = 10;
    let mut cumulative_sum = 0;

    for current_val in 1..=total_count {
        cumulative_sum += current_val;
        println!("Adding value: {}", current_val);
    }
}
`,
  php: `<?php
// AST Parser Playground - PHP
$totalCount = 10;
$cumulativeSum = 0;

for ($i = 1; $i <= $totalCount; $i++) {
    $cumulativeSum += $i;
    echo "Adding value: " . $i . PHP_EOL;
}

function logProgress($label, $value) {
    return $label . " " . $value;
}
`,
  sql: `-- AST Parser Playground - SQL
SELECT 
    user_id,
    COUNT(order_id) AS total_orders,
    SUM(total_amount) AS cumulative_spend
FROM orders
WHERE status = 'completed'
GROUP BY user_id
HAVING COUNT(order_id) > 5
ORDER BY cumulative_spend DESC;
`,
  cobol: `* AST Parser Playground - COBOL
IDENTIFICATION DIVISION.
PROGRAM-ID. EVALUATOR.
PROCEDURE DIVISION.
    DISPLAY "START EVALUATION".
    PERFORM UNTIL CURRENT-VAL > 10
        DISPLAY "CURRENT-VAL"
    END-PERFORM.
`
};

const DEFAULT_DOC_SAMPLE = `React is an open-source frontend library designed by Meta for composing reusable UI components. It manages local component state and updates user interfaces efficiently using a virtual DOM representation.`;

const DEFAULT_REFS_MOCK = [
  {
    id: "Doc 1: React Component Model",
    text: "React is a free and open-source front-end JavaScript library for building user interfaces based on components. It is maintained by Meta and a community of individual developers and companies."
  },
  {
    id: "Doc 2: Node.js Runtime Architecture",
    text: "Node.js is an open-source, cross-platform JavaScript runtime environment that executes JavaScript code outside a web browser. It is built on the Chrome V8 engine and uses an event-driven, non-blocking I/O model."
  },
  {
    id: "Doc 3: State Management in React",
    text: "State management in React can be handled with the useState hook for local state, or Redux Toolkit for complex global state. Using state correctly ensures that components render efficiently."
  }
];

const AVAILABLE_STRUCTURES = [
  { value: "VariableDeclaration", label: "Variable Declarations", hint: "const, let, var" },
  { value: "ForStatement", label: "For Loop Blocks", hint: "for, for..of, for..in" },
  { value: "WhileStatement", label: "While Loop Blocks", hint: "while (...)" },
  { value: "FunctionDeclaration", label: "Function Declarations", hint: "function name() { ... }" },
  { value: "CallExpression", label: "Function Invocations", hint: "func(...)" },
  { value: "Literal", label: "Literals", hint: "Strings, numbers, booleans" }
];

// Heuristic language detector
const detectLanguage = (code) => {
  if (!code || typeof code !== "string" || !code.trim()) return "javascript";

  const trimmed = code.trim();
  const lower = trimmed.toLowerCase();
  const words = trimmed.split(/\s+/);

  const scores = {
    javascript: 0,
    python: 0,
    java: 0,
    cpp: 0,
    go: 0,
    ruby: 0,
    rust: 0,
    php: 0,
    sql: 0,
    cobol: 0
  };

  if (words.includes("int") || words.includes("double") || words.includes("float") || words.includes("char") || words.includes("void")) {
    scores.cpp += 8;
    scores.java += 8;
  }
  if (words.includes("public") || words.includes("private") || words.includes("class")) {
    scores.java += 6;
    scores.cpp += 3;
  }
  if (words.includes("def")) {
    scores.python += 8;
    scores.ruby += 6;
  }
  if (words.includes("func") || words.includes("package")) scores.go += 12;
  if (words.includes("fn") || words.includes("let mut")) scores.rust += 14;
  if (words.includes("echo") || trimmed.includes("<?php")) scores.php += 15;
  if (words.includes("DISPLAY") || lower.includes("identification division")) scores.cobol += 20;
  if (words.includes("SELECT") || lower.includes("from ") || lower.includes("where ")) scores.sql += 15;

  if (trimmed.includes("#include") || trimmed.includes("std::cout")) scores.cpp += 20;
  if (trimmed.includes("System.out.print") || trimmed.includes("public class")) scores.java += 20;
  if (/def\s+[a-zA-Z_]\w*\s*\(.*\)\s*:/m.test(trimmed)) scores.python += 15;
  if (trimmed.includes("const ") || trimmed.includes("let ") || trimmed.includes("console.log")) scores.javascript += 10;

  let maxScore = -1;
  let detected = "javascript";
  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore && score > 0) {
      maxScore = score;
      detected = lang;
    }
  }
  return detected;
};

// Traverse AST to compute summary metrics
const extractASTMetrics = (node) => {
  const metrics = {
    totalNodes: 0,
    maxDepth: 0,
    variables: 0,
    loops: 0,
    functions: 0,
    calls: 0,
    literals: 0
  };

  const walk = (curr, depth = 1) => {
    if (!curr || typeof curr !== "object") return;
    metrics.totalNodes++;
    if (depth > metrics.maxDepth) metrics.maxDepth = depth;

    if (curr.type) {
      if (curr.type.includes("Variable")) metrics.variables++;
      if (curr.type.includes("For") || curr.type.includes("While") || curr.type.includes("Loop")) metrics.loops++;
      if (curr.type.includes("Function")) metrics.functions++;
      if (curr.type.includes("Call")) metrics.calls++;
      if (curr.type.includes("Literal")) metrics.literals++;
    }

    if (Array.isArray(curr)) {
      curr.forEach((item) => walk(item, depth + 1));
    } else {
      Object.keys(curr).forEach((k) => {
        if (typeof curr[k] === "object" && curr[k] !== null) {
          walk(curr[k], depth + 1);
        }
      });
    }
  };

  walk(node);
  return metrics;
};

// Check if AST contains target structure
const checkStructurePresence = (node, structureType) => {
  if (!node || typeof node !== "object") return false;
  if (node.type === structureType) return true;

  if (Array.isArray(node)) {
    return node.some((child) => checkStructurePresence(child, structureType));
  }
  return Object.values(node).some((val) => checkStructurePresence(val, structureType));
};

// Enhanced interactive AST Node Tree Viewer
const ASTNodeTree = ({ node, name = "Root", depth = 0, filterQuery = "" }) => {
  const [collapsed, setCollapsed] = useState(depth > 2);

  if (!node || typeof node !== "object") {
    let valClass = "text-amber-600 dark:text-amber-400";
    if (typeof node === "string") valClass = "text-emerald-600 dark:text-emerald-400";
    if (typeof node === "boolean") valClass = "text-purple-600 dark:text-purple-400";
    if (node === null) valClass = "text-slate-400 italic";

    return (
      <span className={`font-mono text-sm ${valClass}`}>
        {JSON.stringify(node)}
      </span>
    );
  }

  const isArray = Array.isArray(node);
  const keys = Object.keys(node).filter((k) => k !== "fail" && k !== "output");
  const nodeType = !isArray ? node.type || "Object" : null;

  const isHighlighted =
    filterQuery &&
    (name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (nodeType && nodeType.toLowerCase().includes(filterQuery.toLowerCase())));

  return (
    <div className={`my-1 font-mono text-sm ${depth > 0 ? "pl-3.5 border-l border-slate-200 dark:border-slate-800" : ""}`}>
      <div
        onClick={() => setCollapsed(!collapsed)}
        className={`flex items-center gap-2 py-0.5 px-2 rounded cursor-pointer transition-colors select-none group ${
          isHighlighted
            ? "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-medium"
            : "hover:bg-slate-100 dark:hover:bg-slate-800/60"
        }`}
      >
        <span className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>

        <span className="text-slate-600 dark:text-slate-400 font-normal">{name}:</span>

        {isArray ? (
          <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded text-xs font-normal border border-indigo-200/50 dark:border-indigo-800/50">
            Array[{node.length}]
          </span>
        ) : (
          <span className="text-violet-700 dark:text-violet-300 font-normal bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded text-xs border border-violet-200/60 dark:border-violet-800/50">
            {nodeType}
          </span>
        )}

        {collapsed && (
          <span className="text-xs text-slate-400 group-hover:text-slate-500 font-sans">
            ({keys.length} properties)
          </span>
        )}
      </div>

      {!collapsed && (
        <div className="space-y-0.5 mt-0.5">
          {keys.map((key) => {
            const child = node[key];
            const isChildObj = typeof child === "object" && child !== null;

            return (
              <div key={key} className="flex flex-wrap items-baseline gap-2">
                {isChildObj ? (
                  <ASTNodeTree node={child} name={key} depth={depth + 1} filterQuery={filterQuery} />
                ) : (
                  <div className="flex items-center gap-2 pl-6 py-0.5">
                    <span className="text-slate-500 dark:text-slate-400 font-normal">{key}:</span>
                    <ASTNodeTree node={child} name={key} depth={depth + 1} filterQuery={filterQuery} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AlgorithmPlayground = () => {
  const [activeTab, setActiveTab] = useState("ast"); // "ast" | "plagiarism"

  // ---------------- AST Parser State ----------------
  const [code, setCode] = useState(LANGUAGE_SAMPLES.javascript);
  const [selectedStructures, setSelectedStructures] = useState([
    "VariableDeclaration",
    "ForStatement"
  ]);
  const [language, setLanguage] = useState("javascript");
  const [dynamicLanguages, setDynamicLanguages] = useState([
    "javascript",
    "python",
    "java",
    "cpp",
    "go",
    "ruby",
    "rust",
    "php",
    "sql",
    "cobol"
  ]);
  const [astResult, setAstResult] = useState(null);
  const [astViewMode, setAstViewMode] = useState("tree"); // "tree" | "json" | "metrics"
  const [astFilterQuery, setAstFilterQuery] = useState("");
  const [hasCopiedAst, setHasCopiedAst] = useState(false);
  const [hasCopiedCode, setHasCopiedCode] = useState(false);

  // Line count for code editor gutter
  const editorLineCount = useMemo(() => {
    return Math.max(code.split("\n").length, 14);
  }, [code]);

  // Code editor textarea ref for syncing scroll
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const handleEditorScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // ---------------- Plagiarism State ----------------
  const [plagiarismMode, setPlagiarismMode] = useState("single"); // "single" | "bulk"
  const [docText, setDocText] = useState(DEFAULT_DOC_SAMPLE);
  const [comparisonDocs, setComparisonDocs] = useState(DEFAULT_REFS_MOCK);
  const [threshold, setThreshold] = useState(0.4);
  const [plagiarismResult, setPlagiarismResult] = useState(null);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocText, setNewDocText] = useState("");
  const [showAddDocForm, setShowAddDocForm] = useState(false);

  // Bulk mode
  const [bulkFiles, setBulkFiles] = useState([]);
  const [crossPlagiarismResult, setCrossPlagiarismResult] = useState(null);

  // RTK Mutations
  const [validateCodeAST, { isLoading: isASTLoading }] = useValidateCodeASTMutation();
  const [checkPlagiarismLSH, { isLoading: isPlagiarismLoading }] = useCheckPlagiarismLSHMutation();
  const [crossComparePlagiarism, { isLoading: isCrossLoading }] = useCrossComparePlagiarismMutation();

  // Handlers for AST Structures
  const handleStructureToggle = (val) => {
    if (selectedStructures.includes(val)) {
      setSelectedStructures(selectedStructures.filter((s) => s !== val));
    } else {
      setSelectedStructures([...selectedStructures, val]);
    }
  };

  const handleSelectAllStructures = () => {
    setSelectedStructures(AVAILABLE_STRUCTURES.map((s) => s.value));
  };

  const handleClearAllStructures = () => {
    setSelectedStructures([]);
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    const detected = detectLanguage(newCode);
    if (detected !== language) {
      setLanguage(detected);
    }
  };

  // Run AST Analysis
  const handleRunASTValidation = useCallback(async () => {
    if (!code.trim()) {
      toast.error("Please enter code before running analysis.");
      return;
    }
    try {
      const detected = detectLanguage(code);
      setLanguage(detected);

      const res = await validateCodeAST({
        code,
        requiredStructures: selectedStructures,
        language: detected
      }).unwrap();

      if (res.success) {
        setAstResult(res);
        if (res.language && !dynamicLanguages.includes(res.language)) {
          setDynamicLanguages((prev) => [...prev, res.language]);
        }
        if (res.error) {
          toast.error("Compilation error detected in source code.");
        } else if (res.isValid) {
          toast.success("AST analysis complete - All required structures matched!");
        } else {
          toast.warning("AST generated, but code is missing selected structures.");
        }
      } else {
        toast.error(res.message || "Failed to analyze code structure.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error evaluating AST code validator.");
    }
  }, [code, selectedStructures, validateCodeAST, dynamicLanguages]);

  // Keyboard shortcut Ctrl+Enter or Cmd+Enter to execute AST
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRunASTValidation();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRunASTValidation]);

  // Copy AST JSON
  const handleCopyAST = () => {
    if (!astResult?.ast) return;
    navigator.clipboard.writeText(JSON.stringify(astResult.ast, null, 2));
    setHasCopiedAst(true);
    toast.success("AST JSON copied to clipboard");
    setTimeout(() => setHasCopiedAst(false), 2000);
  };

  // Copy Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setHasCopiedCode(true);
    toast.success("Source code copied");
    setTimeout(() => setHasCopiedCode(false), 2000);
  };

  // Handle Tab key in code editor
  const handleTextareaKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const { selectionStart, selectionEnd } = e.target;
      const newCode = code.substring(0, selectionStart) + "  " + code.substring(selectionEnd);
      setCode(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = selectionStart + 2;
          textareaRef.current.selectionEnd = selectionStart + 2;
        }
      }, 0);
    }
  };

  // Handlers for Plagiarism
  const handleAddReferenceDoc = () => {
    if (!newDocTitle.trim() || !newDocText.trim()) {
      toast.error("Title and document text are required.");
      return;
    }
    setComparisonDocs([
      ...comparisonDocs,
      { id: newDocTitle.trim(), text: newDocText.trim() }
    ]);
    setNewDocTitle("");
    setNewDocText("");
    setShowAddDocForm(false);
    toast.success("Reference document added to comparison library.");
  };

  const handleDeleteReferenceDoc = (index) => {
    setComparisonDocs(comparisonDocs.filter((_, idx) => idx !== index));
    toast.info("Reference document removed.");
  };

  const handleRestoreDefaultReferences = () => {
    setComparisonDocs(DEFAULT_REFS_MOCK);
    toast.success("Default reference documents restored.");
  };

  const handleRunPlagiarismCheck = async () => {
    if (!docText.trim()) {
      toast.error("Target document text cannot be empty.");
      return;
    }
    if (comparisonDocs.length === 0) {
      toast.error("Comparison library is empty. Please add reference documents.");
      return;
    }
    try {
      const res = await checkPlagiarismLSH({
        docText,
        referenceDocs: comparisonDocs,
        threshold: Number(threshold)
      }).unwrap();

      if (res.success) {
        setPlagiarismResult(res);
        if (res.matches && res.matches.length > 0) {
          toast.warning(`Plagiarism detected: ${res.matches.length} matching document(s).`);
        } else {
          toast.success("Plagiarism evaluation complete: No duplicates flagged.");
        }
      } else {
        toast.error(res.message || "Failed to scan document duplicates.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error checking plagiarism.");
    }
  };

  // Bulk File Upload
  const handleBulkFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    let loadedCount = 0;
    const newLoadedFiles = [];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newLoadedFiles.push({
          id: file.name,
          text: event.target.result,
          size: file.size
        });
        loadedCount++;
        if (loadedCount === files.length) {
          setBulkFiles((prev) => {
            const combined = [...prev];
            newLoadedFiles.forEach((nf) => {
              const existingIdx = combined.findIndex((c) => c.id === nf.id);
              if (existingIdx !== -1) {
                combined[existingIdx] = nf;
              } else {
                combined.push(nf);
              }
            });
            return combined;
          });
          toast.success(`Loaded ${files.length} document(s).`);
        }
      };
      reader.onerror = () => {
        toast.error(`Error reading ${file.name}`);
        loadedCount++;
      };
      reader.readAsText(file);
    });
    e.target.value = null;
  };

  // Preload Demo Batch for Cross-comparison
  const handleLoadDemoBatch = () => {
    setBulkFiles([
      {
        id: "Assignment_Alice.js",
        text: `function calculateSum(n) {\n  let sum = 0;\n  for (let i = 1; i <= n; i++) {\n    sum += i;\n  }\n  return sum;\n}`,
        size: 94
      },
      {
        id: "Assignment_Bob.js",
        text: `function calculateSum(total) {\n  let sum = 0;\n  for (let counter = 1; counter <= total; counter++) {\n    sum += counter;\n  }\n  return sum;\n}`,
        size: 110
      },
      {
        id: "Assignment_Charlie.js",
        text: `// Functional approach using Gauss formula\nfunction calculateSum(n) {\n  return (n * (n + 1)) / 2;\n}`,
        size: 85
      }
    ]);
    toast.success("Loaded 3 demo student assignments for cross-check.");
  };

  const handleRunCrossPlagiarismCheck = async () => {
    if (bulkFiles.length < 2) {
      toast.error("Please provide at least 2 files for cross-comparison.");
      return;
    }
    try {
      const res = await crossComparePlagiarism({
        documents: bulkFiles,
        threshold: Number(threshold)
      }).unwrap();

      if (res.success) {
        setCrossPlagiarismResult(res);
        toast.success("Cross-comparison completed.");
      } else {
        toast.error(res.message || "Failed to cross-compare files.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error evaluating cross-plagiarism check.");
    }
  };

  // Computed AST summary metrics
  const astMetrics = useMemo(() => {
    if (!astResult?.ast) return null;
    return extractASTMetrics(astResult.ast);
  }, [astResult]);

  return (
    <div className="w-full max-w-[1560px] mx-auto space-y-6 pb-12">
      {/* ================= COMPACT STUDIO HEADER ================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-slate-800 dark:text-slate-100">
                Algorithm Playground
              </h1>
              <span className="text-xs font-normal uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 px-2.5 py-0.5 rounded-full">
                Compiler & NLP Lab
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal">
              Live syntax tree parser, compiler AST structure validation, and LSH MinHash duplicate verification.
            </p>
          </div>
        </div>

        {/* Primary Tab Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("ast")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === "ast"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/50 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-normal"
            }`}
          >
            <Code className="w-4 h-4" />
            AST Code Parser
          </button>
          <button
            onClick={() => setActiveTab("plagiarism")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === "plagiarism"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/50 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-normal"
            }`}
          >
            <FileText className="w-4 h-4" />
            LSH Plagiarism Checker
          </button>
        </div>
      </div>

      {/* ================= TAB 1: AST CODE PARSER ================= */}
      {activeTab === "ast" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Code Editor & Validation Settings (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Editor Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col">
              {/* Studio Editor Header */}
              <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="text-slate-400 font-mono text-xs ml-1">
                    source.{language === "javascript" ? "js" : language === "python" ? "py" : language === "java" ? "java" : language === "cpp" ? "cpp" : language === "sql" ? "sql" : language}
                  </span>

                  {/* Language Selector */}
                  <div className="relative">
                    <select
                      value={language}
                      onChange={(e) => {
                        const newLang = e.target.value;
                        if (newLang === "custom_add") {
                          const customName = prompt("Enter language identifier (e.g. scala, haskell, kotlin):");
                          if (customName && customName.trim()) {
                            const formatted = customName.trim().toLowerCase();
                            if (!dynamicLanguages.includes(formatted)) {
                              setDynamicLanguages((prev) => [...prev, formatted]);
                            }
                            setLanguage(formatted);
                            setCode(LANGUAGE_SAMPLES[formatted] || `// Write your ${customName} logic here\n`);
                          }
                        } else {
                          setLanguage(newLang);
                          if (LANGUAGE_SAMPLES[newLang]) {
                            setCode(LANGUAGE_SAMPLES[newLang]);
                          }
                        }
                      }}
                      className="bg-slate-800 text-slate-200 border border-slate-700 rounded-md px-3 py-1.5 text-sm font-normal outline-none focus:border-indigo-500 cursor-pointer capitalize"
                    >
                      {dynamicLanguages.map((lang) => (
                        <option key={lang} value={lang} className="bg-slate-900 text-slate-200">
                          {lang === "cpp" ? "C++" : lang === "cobol" ? "COBOL" : lang === "sql" ? "SQL" : lang === "php" ? "PHP" : lang}
                        </option>
                      ))}
                      <option value="custom_add" className="bg-slate-900 text-indigo-400">
                        + Add Language
                      </option>
                    </select>
                  </div>
                </div>

                {/* Editor Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (LANGUAGE_SAMPLES[language]) {
                        setCode(LANGUAGE_SAMPLES[language]);
                        toast.info(`Reset to default ${language} sample`);
                      }
                    }}
                    title="Reload sample code"
                    className="flex items-center gap-1.5 px-2.5 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors text-xs font-normal"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Sample
                  </button>

                  <button
                    onClick={handleCopyCode}
                    title="Copy code"
                    className="flex items-center gap-1.5 px-2.5 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors text-xs font-normal"
                  >
                    {hasCopiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </button>

                  <button
                    onClick={() => setCode("")}
                    title="Clear editor"
                    className="flex items-center gap-1.5 px-2.5 py-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors text-xs font-normal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear
                  </button>

                  <Button
                    size="sm"
                    onClick={handleRunASTValidation}
                    disabled={isASTLoading || !code.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm h-8 px-4 rounded-md shadow-xs ml-1 flex items-center gap-1.5"
                  >
                    {isASTLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Run AST
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Code Area with Synchronized Line Numbers */}
              <div className="relative flex bg-[#0c1222] font-mono text-sm overflow-hidden h-[380px]">
                {/* Line numbers gutter */}
                <div
                  ref={lineNumbersRef}
                  className="w-12 bg-slate-950/80 text-slate-600 select-none py-3.5 text-right pr-2.5 font-mono text-xs overflow-hidden border-r border-slate-800/60 shrink-0"
                >
                  {Array.from({ length: editorLineCount }, (_, i) => (
                    <div key={i + 1} className="leading-6 h-6">
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  onScroll={handleEditorScroll}
                  onKeyDown={handleTextareaKeyDown}
                  spellCheck="false"
                  placeholder="// Paste or write source code here..."
                  className="flex-1 bg-transparent text-indigo-100 placeholder:text-slate-600 p-3.5 outline-none resize-none font-mono text-sm leading-6 whitespace-pre overflow-y-auto selection:bg-indigo-600/40"
                />
              </div>

              {/* Editor Footer Status */}
              <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
                <div className="flex items-center gap-4">
                  <span>Lines: {code.split("\n").length}</span>
                  <span>Chars: {code.length}</span>
                  <span className="capitalize text-slate-400">Language: {language}</span>
                </div>
                <div className="text-slate-400 flex items-center gap-1.5 text-xs">
                  <span>Shortcut:</span>
                  <kbd className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">Enter</kbd>
                </div>
              </div>
            </div>

            {/* Validation Rules Section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-xl shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-base font-medium text-slate-800 dark:text-slate-100">
                    Target AST Structures to Verify
                  </span>
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-full font-normal">
                    {selectedStructures.length} / {AVAILABLE_STRUCTURES.length} active
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <button
                    onClick={handleSelectAllStructures}
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-normal"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <button
                    onClick={handleClearAllStructures}
                    className="text-slate-500 hover:text-slate-700 dark:text-slate-400 font-normal"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                The compiler analyzes the Abstract Syntax Tree and verifies whether each enabled structure exists in the parsed grammar.
              </p>

              {/* Grid of interactive rule chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {AVAILABLE_STRUCTURES.map((struct) => {
                  const isChecked = selectedStructures.includes(struct.value);
                  const isFoundInAst = astResult?.ast && checkStructurePresence(astResult.ast, struct.value);

                  return (
                    <label
                      key={struct.value}
                      className={`flex items-start justify-between p-3 rounded-lg border cursor-pointer select-none transition-all ${
                        isChecked
                          ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/60 shadow-xs"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleStructureToggle(struct.value)}
                          className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <div>
                          <span className="text-sm font-normal text-slate-800 dark:text-slate-200 block">
                            {struct.label}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {struct.hint}
                          </span>
                        </div>
                      </div>

                      {/* Visual Verification Badge (if AST was analyzed) */}
                      {astResult?.ast && isChecked && (
                        <div className="shrink-0 ml-2">
                          {isFoundInAst ? (
                            <span className="inline-flex items-center gap-1 text-xs font-normal text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/70 px-2 py-0.5 rounded">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              Found
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-normal text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/70 px-2 py-0.5 rounded">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              Missing
                            </span>
                          )}
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: AST Compiler Results & Inspector (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col min-h-[540px]">
              {/* Header with View Mode Switcher */}
              <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-base font-medium text-slate-800 dark:text-slate-100">
                    AST Compiler Results
                  </span>
                </div>

                {astResult?.ast && (
                  <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-md text-xs font-normal text-slate-600 dark:text-slate-400">
                      <button
                        onClick={() => setAstViewMode("tree")}
                        className={`px-2.5 py-1 rounded ${
                          astViewMode === "tree"
                            ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-medium"
                            : "hover:text-slate-900 dark:hover:text-slate-200"
                        }`}
                      >
                        Tree
                      </button>
                      <button
                        onClick={() => setAstViewMode("json")}
                        className={`px-2.5 py-1 rounded ${
                          astViewMode === "json"
                            ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-medium"
                            : "hover:text-slate-900 dark:hover:text-slate-200"
                        }`}
                      >
                        JSON
                      </button>
                      <button
                        onClick={() => setAstViewMode("metrics")}
                        className={`px-2.5 py-1 rounded ${
                          astViewMode === "metrics"
                            ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-medium"
                            : "hover:text-slate-900 dark:hover:text-slate-200"
                        }`}
                      >
                        Metrics
                      </button>
                    </div>

                    <button
                      onClick={handleCopyAST}
                      title="Copy AST JSON"
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
                    >
                      {hasCopiedAst ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Main Content Area */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col">
                {astResult ? (
                  <div className="space-y-4 flex-1 flex flex-col">
                    {/* Execution Status Banner */}
                    {astResult.error ? (
                      <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 text-sm flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <span className="font-medium block text-base">Compilation Parsing Error</span>
                          <p className="font-mono text-xs leading-relaxed break-all font-normal">{astResult.error}</p>
                        </div>
                      </div>
                    ) : astResult.isValid ? (
                      <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-sm flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium block text-base">AST Validation Passed</span>
                          <p className="text-slate-600 dark:text-slate-300 mt-1 font-normal">
                            All {selectedStructures.length} required syntax structures were identified in the syntax tree.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-sm flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium block text-base">Structure Requirement Missing</span>
                          <p className="text-slate-600 dark:text-slate-300 mt-1 font-normal">
                            Code parsed into valid AST, but does not satisfy all required structure checks.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* View Modes */}
                    {astResult.ast && (
                      <div className="flex-1 flex flex-col">
                        {/* 1. Tree View Mode */}
                        {astViewMode === "tree" && (
                          <div className="space-y-3 flex-1 flex flex-col">
                            {/* Filter input */}
                            <div className="relative">
                              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Filter node types (e.g. Variable, For, Identifier)..."
                                value={astFilterQuery}
                                onChange={(e) => setAstFilterQuery(e.target.value)}
                                className="w-full h-9 pl-9 pr-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md outline-none focus:border-indigo-500 font-sans font-normal"
                              />
                            </div>

                            <div className="border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/60 dark:bg-slate-950 p-3.5 h-[400px] overflow-y-auto">
                              <ASTNodeTree node={astResult.ast} name="Program" filterQuery={astFilterQuery} />
                            </div>
                          </div>
                        )}

                        {/* 2. Raw JSON View Mode */}
                        {astViewMode === "json" && (
                          <div className="border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-950 text-indigo-200 p-4 h-[440px] overflow-y-auto font-mono text-xs leading-relaxed font-normal">
                            <pre>{JSON.stringify(astResult.ast, null, 2)}</pre>
                          </div>
                        )}

                        {/* 3. Syntax Metrics View Mode */}
                        {astViewMode === "metrics" && astMetrics && (
                          <div className="space-y-3 pt-1">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                <span className="text-xs text-slate-500 font-normal block">Total AST Nodes</span>
                                <span className="text-2xl font-normal text-indigo-600 dark:text-indigo-400 mt-1 block">
                                  {astMetrics.totalNodes}
                                </span>
                              </div>
                              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                <span className="text-xs text-slate-500 font-normal block">Max Tree Depth</span>
                                <span className="text-2xl font-normal text-violet-600 dark:text-violet-400 mt-1 block">
                                  {astMetrics.maxDepth}
                                </span>
                              </div>
                              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                <span className="text-xs text-slate-500 font-normal block">Variables Declared</span>
                                <span className="text-2xl font-normal text-slate-800 dark:text-slate-200 mt-1 block">
                                  {astMetrics.variables}
                                </span>
                              </div>
                              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                <span className="text-xs text-slate-500 font-normal block">Loops Detected</span>
                                <span className="text-2xl font-normal text-slate-800 dark:text-slate-200 mt-1 block">
                                  {astMetrics.loops}
                                </span>
                              </div>
                              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                <span className="text-xs text-slate-500 font-normal block">Functions Defined</span>
                                <span className="text-2xl font-normal text-slate-800 dark:text-slate-200 mt-1 block">
                                  {astMetrics.functions}
                                </span>
                              </div>
                              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                <span className="text-xs text-slate-500 font-normal block">Function Invocations</span>
                                <span className="text-2xl font-normal text-slate-800 dark:text-slate-200 mt-1 block">
                                  {astMetrics.calls}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Initial Empty State */
                  <div className="my-auto py-14 px-6 flex flex-col items-center justify-center text-center space-y-3.5">
                    <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs">
                      <Layers className="w-7 h-7" />
                    </div>
                    <div className="space-y-1.5 max-w-sm">
                      <h4 className="text-base font-medium text-slate-800 dark:text-slate-200">
                        Compiler Parser Ready
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                        Execute source code on the left to generate the Abstract Syntax Tree, inspect structural grammar, and verify required node patterns.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleRunASTValidation}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-normal text-sm mt-2 h-9 px-4"
                    >
                      <Play className="w-3.5 h-3.5 fill-current mr-2" />
                      Run Sample AST Analysis
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: LSH PLAGIARISM CHECKER ================= */}
      {activeTab === "plagiarism" && (
        <div className="space-y-6">
          {/* Sub-mode segmented toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
              <button
                onClick={() => setPlagiarismMode("single")}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-md transition-all ${
                  plagiarismMode === "single"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-normal"
                }`}
              >
                <FileText className="w-4 h-4" />
                Single Document vs Library
              </button>
              <button
                onClick={() => setPlagiarismMode("bulk")}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-md transition-all ${
                  plagiarismMode === "bulk"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-normal"
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                Batch Cross-Comparison
              </button>
            </div>

            {/* Threshold Slider in Header */}
            <div className="flex items-center gap-3.5">
              <span className="text-sm font-normal text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-500" />
                Similarity Threshold:
              </span>
              <span className="text-sm font-normal font-mono bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 rounded">
                {(threshold * 100).toFixed(0)}% Match
              </span>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-32 sm:w-40 accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg outline-none"
              />
            </div>
          </div>

          {/* SINGLE DOCUMENT MODE */}
          {plagiarismMode === "single" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Target submission & Comparison Docs */}
              <div className="lg:col-span-7 space-y-5">
                {/* Target Document Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-5 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Target Submission Text
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setDocText(DEFAULT_DOC_SAMPLE)}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-normal"
                      >
                        Reset Sample
                      </button>
                      <button
                        onClick={() => setDocText("")}
                        className="text-sm text-slate-400 hover:text-rose-500 font-normal"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <textarea
                      value={docText}
                      onChange={(e) => setDocText(e.target.value)}
                      placeholder="Paste or write the student submission text to compare..."
                      className="w-full h-36 p-3.5 text-sm text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500 resize-none font-sans leading-relaxed font-normal"
                    />
                    <div className="flex justify-between items-center text-xs text-slate-400 mt-2 px-1 font-normal">
                      <span>{docText.trim().split(/\s+/).filter(Boolean).length} words</span>
                      <span>{docText.length} characters</span>
                    </div>
                  </div>
                </div>

                {/* Reference Documents Library */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-base font-medium text-slate-800 dark:text-slate-100">
                        Reference Comparison Library ({comparisonDocs.length})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleRestoreDefaultReferences}
                        className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 font-normal"
                      >
                        Restore Defaults
                      </button>
                      <button
                        onClick={() => setShowAddDocForm(!showAddDocForm)}
                        className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {showAddDocForm ? "Close Form" : "Add Reference"}
                      </button>
                    </div>
                  </div>

                  {/* Add New Reference Form */}
                  {showAddDocForm && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 block">
                        Add New Reference Document
                      </span>
                      <input
                        type="text"
                        placeholder="Document Title (e.g. Reference D: Data Structures)"
                        value={newDocTitle}
                        onChange={(e) => setNewDocTitle(e.target.value)}
                        className="w-full h-9 px-3 text-sm border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 outline-none focus:border-indigo-500 font-normal"
                      />
                      <textarea
                        placeholder="Document content text to shingle and compare..."
                        value={newDocText}
                        onChange={(e) => setNewDocText(e.target.value)}
                        className="w-full h-24 p-3 text-sm border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 outline-none focus:border-indigo-500 resize-none font-normal"
                      />
                      <div className="flex justify-end gap-2.5 pt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowAddDocForm(false)}
                          className="h-8 text-sm font-normal"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleAddReferenceDoc}
                          className="h-8 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-normal"
                        >
                          Save Reference
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Reference Document Items */}
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {comparisonDocs.map((doc, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 flex items-start justify-between gap-3 text-sm"
                      >
                        <div className="space-y-1">
                          <span className="font-medium text-slate-800 dark:text-slate-200 block">
                            {doc.id}
                          </span>
                          <p className="text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed text-xs font-normal">
                            {doc.text}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteReferenceDoc(idx)}
                          title="Remove document"
                          className="text-slate-400 hover:text-rose-500 p-1 shrink-0 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Run Button */}
                  <Button
                    onClick={handleRunPlagiarismCheck}
                    disabled={isPlagiarismLoading || !docText.trim() || comparisonDocs.length === 0}
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-xs flex items-center justify-center gap-2 mt-2"
                  >
                    {isPlagiarismLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating MinHash Signatures...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        Run LSH Plagiarism Scan
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Right Column: Plagiarism Results */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden min-h-[500px] flex flex-col">
                  <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-5 py-3.5 flex items-center justify-between">
                    <span className="text-base font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      MinHash & LSH Results
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 flex-1 flex flex-col">
                    {plagiarismResult ? (
                      <div className="space-y-4">
                        {/* Overview Banner */}
                        <div className="p-3.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 text-sm">
                          <span className="font-medium text-indigo-950 dark:text-indigo-200 block mb-1">
                            LSH Shingle Verification
                          </span>
                          <p className="text-indigo-800/80 dark:text-indigo-300/80 text-xs leading-relaxed font-normal">
                            Compared 5-gram shingles against {plagiarismResult.totalCompared} reference files at {(plagiarismResult.threshold * 100).toFixed(0)}% similarity threshold.
                          </p>
                        </div>

                        {/* Matches List */}
                        {plagiarismResult.matches && plagiarismResult.matches.length > 0 ? (
                          <div className="space-y-3">
                            <span className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                              ⚠️ Plagiarism Threshold Exceeded ({plagiarismResult.matches.length})
                            </span>

                            {plagiarismResult.matches.map((match) => (
                              <div
                                key={match.id}
                                className="border border-rose-200 dark:border-rose-900/70 bg-rose-50/30 dark:bg-rose-950/20 p-4 rounded-lg space-y-2.5 text-sm"
                              >
                                <div className="flex justify-between items-center gap-2">
                                  <span className="font-normal text-slate-800 dark:text-slate-200 truncate">
                                    {match.id}
                                  </span>
                                  <span className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-normal px-2.5 py-0.5 rounded text-xs font-mono shrink-0">
                                    {(match.similarity * 100).toFixed(0)}% Match
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-rose-600 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(match.similarity * 100, 100)}%` }}
                                  />
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                                  Shingle collision flagged with estimated Jaccard similarity &ge; threshold.
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-sm flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-medium block text-base">Clean Document - No Matches</span>
                              <p className="mt-1 text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-normal">
                                Document shingle signature remained strictly below the similarity threshold across all comparison references.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="my-auto py-14 px-6 flex flex-col items-center justify-center text-center space-y-3.5">
                        <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs">
                          <ShieldCheck className="w-7 h-7" />
                        </div>
                        <div className="space-y-1.5 max-w-xs">
                          <h4 className="text-base font-medium text-slate-800 dark:text-slate-200">
                            Plagiarism Scanner Idle
                          </h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                            Click &quot;Run LSH Plagiarism Scan&quot; to tokenize shingles and evaluate MinHash Jaccard similarities.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* BULK CROSS-COMPARISON MODE */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: File Dropzone & Upload List */}
              <div className="lg:col-span-7 space-y-5">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Upload Documents for Cross-Comparison
                    </span>
                    <button
                      onClick={handleLoadDemoBatch}
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-normal bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded"
                    >
                      Load Demo Files (3)
                    </button>
                  </div>

                  {/* Dropzone */}
                  <label className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-7 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors text-center">
                    <UploadCloud className="w-9 h-9 text-indigo-500" />
                    <span className="text-sm font-normal text-slate-700 dark:text-slate-300">
                      Drag & drop files here, or <span className="text-indigo-600 dark:text-indigo-400 underline font-medium">browse</span>
                    </span>
                    <span className="text-xs text-slate-400 font-normal">
                      Supports .js, .py, .java, .cpp, .html, .txt, .sql code and text documents
                    </span>
                    <input
                      type="file"
                      multiple
                      onChange={handleBulkFileUpload}
                      className="hidden"
                      accept=".txt,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.h,.go,.rb,.cob,.php,.html,.css,.sql"
                    />
                  </label>

                  {/* Uploaded File List */}
                  {bulkFiles.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-sm text-slate-500 font-normal">
                        <span>Uploaded Documents ({bulkFiles.length})</span>
                        <button
                          onClick={() => setBulkFiles([])}
                          className="text-rose-500 hover:underline font-normal"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {bulkFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-sm font-normal"
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <File className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="truncate text-slate-700 dark:text-slate-300">
                                {file.id}
                              </span>
                              <span className="text-xs text-slate-400">
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <button
                              onClick={() => setBulkFiles(bulkFiles.filter((_, i) => i !== idx))}
                              className="text-slate-400 hover:text-rose-500 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Run Button */}
                  <Button
                    onClick={handleRunCrossPlagiarismCheck}
                    disabled={isCrossLoading || bulkFiles.length < 2}
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-xs flex items-center justify-center gap-2"
                  >
                    {isCrossLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Evaluating Pairwise Signatures...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        Run Batch Cross-Comparison ({bulkFiles.length} files)
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Right Column: Cross Plagiarism Results */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden min-h-[500px] flex flex-col">
                  <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-5 py-3.5 flex items-center justify-between">
                    <span className="text-base font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Pairwise Cross-Comparison Matrix
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 flex-1 flex flex-col">
                    {crossPlagiarismResult ? (
                      <div className="space-y-4">
                        <div className="p-3.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 text-sm">
                          <span className="font-medium text-indigo-950 dark:text-indigo-200 block mb-1">
                            Pairwise Matrix Analysis
                          </span>
                          <p className="text-indigo-800/80 dark:text-indigo-300/80 text-xs leading-relaxed font-normal">
                            Cross-checked {bulkFiles.length} files against one another. Flags indicate similarity &ge; {(threshold * 100).toFixed(0)}%.
                          </p>
                        </div>

                        {/* Matched Pair list */}
                        {(() => {
                          const flaggedPairs = [];
                          crossPlagiarismResult.results.forEach((res) => {
                            res.matches.forEach((match) => {
                              const pairKey = [res.id, match.id].sort().join(" <-> ");
                              if (!flaggedPairs.some((p) => p.key === pairKey)) {
                                flaggedPairs.push({
                                  key: pairKey,
                                  docA: res.id,
                                  docB: match.id,
                                  similarity: match.similarity
                                });
                              }
                            });
                          });

                          if (flaggedPairs.length > 0) {
                            return (
                              <div className="space-y-3">
                                <span className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                                  ⚠️ Flagged Plagiarism Connections ({flaggedPairs.length})
                                </span>
                                {flaggedPairs.map((pair, idx) => (
                                  <div
                                    key={idx}
                                    className="border border-rose-200 dark:border-rose-900/70 bg-rose-50/30 dark:bg-rose-950/20 p-3.5 rounded-lg space-y-2.5 text-sm"
                                  >
                                    <div className="flex justify-between items-center gap-2">
                                      <div className="truncate max-w-[210px] text-slate-800 dark:text-slate-200 font-normal">
                                        <span className="truncate block font-normal">{pair.docA}</span>
                                        <span className="text-xs text-slate-400 font-normal">matches with</span>
                                        <span className="truncate block font-normal">{pair.docB}</span>
                                      </div>
                                      <span className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-normal px-2.5 py-0.5 rounded text-xs font-mono shrink-0">
                                        {(pair.similarity * 100).toFixed(0)}% Match
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                      <div
                                        className="bg-rose-600 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(pair.similarity * 100, 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          } else {
                            return (
                              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-sm flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-medium block text-base">No Cross-Plagiarism Detected</span>
                                  <p className="mt-1 text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-normal">
                                    All pairwise document comparisons scored below the {(threshold * 100).toFixed(0)}% similarity threshold.
                                  </p>
                                </div>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    ) : (
                      <div className="my-auto py-14 px-6 flex flex-col items-center justify-center text-center space-y-3.5">
                        <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs">
                          <BarChart3 className="w-7 h-7" />
                        </div>
                        <div className="space-y-1.5 max-w-xs">
                          <h4 className="text-base font-medium text-slate-800 dark:text-slate-200">
                            Batch Comparator Ready
                          </h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                            Upload 2 or more documents and run the batch comparison to generate the pairwise similarity matrix.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AlgorithmPlayground;
