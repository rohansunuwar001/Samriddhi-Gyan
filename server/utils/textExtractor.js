import fs from "fs";
import path from "path";

export async function extractTextFromFile(filePath, originalName) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found on disk at path: ${filePath}`);
  }

  const ext = path.extname(originalName).toLowerCase();

  // 1. Handle plain text files and programming extensions
  const textExtensions = [
    ".txt", ".csv", ".js", ".py", ".java", ".cpp", ".c", ".h", 
    ".cs", ".go", ".rs", ".ts", ".jsx", ".tsx", ".html", ".css", 
    ".json", ".md", ".xml", ".yaml", ".yml", ".sql"
  ];

  if (textExtensions.includes(ext)) {
    try {
      return fs.readFileSync(filePath, "utf8");
    } catch (err) {
      console.error("Text file read error:", err);
      throw new Error(`Failed to read text file contents: ${err.message}`);
    }
  }

  // 2. Handle DOCX files using mammoth
  if (ext === ".docx") {
    try {
      const { default: mammoth } = await import("mammoth");
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || "";
    } catch (err) {
      console.warn("Mammoth extraction failed or not loaded. Using fallback binary text parser.", err.message);
      return extractAlphanumericFallback(filePath);
    }
  }

  // 3. Handle PDF files using pdf-parse
  if (ext === ".pdf") {
    try {
      const { default: pdfParse } = await import("pdf-parse");
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text || "";
    } catch (err) {
      console.warn("pdf-parse extraction failed or not loaded. Using fallback binary text parser.", err.message);
      return extractAlphanumericFallback(filePath);
    }
  }

  // 4. Default fallback: read printable characters from binary/unknown files
  return extractAlphanumericFallback(filePath);
}


function extractAlphanumericFallback(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    let out = "";
    // Filter printable ASCII characters
    for (let i = 0; i < Math.min(buffer.length, 100000); i++) {
      const code = buffer[i];
      if ((code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9) {
        out += String.fromCharCode(code);
      }
    }
    // Clean up excessive whitespace/null blocks
    return out.replace(/\0/g, "").replace(/\s+/g, " ").trim();
  } catch (err) {
    console.error("Binary fallback scraping failed:", err.message);
    return "Error: Could not extract text from document.";
  }
}
