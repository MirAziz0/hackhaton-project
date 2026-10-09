import "server-only";
import { PDFParse } from "pdf-parse";

// Extracts plain text from an uploaded PDF. Returns an empty string for scanned/image-only files.
export async function extractPdfText(data: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(data) });
  try {
    const result = await parser.getText();
    return result.text.replace(/\s+\n/g, "\n").trim();
  } finally {
    await parser.destroy();
  }
}
