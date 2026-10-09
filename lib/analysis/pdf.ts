import "server-only";

// Extracts plain text from an uploaded PDF. Returns an empty string for scanned/image-only files.
// unpdf ships a serverless build of pdf.js (no worker file, no native canvas), so it also runs
// on Vercel functions. It is imported lazily so a parser problem can never break the whole route.
export async function extractPdfText(data: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(data));
  const { text } = await extractText(pdf, { mergePages: true });
  return text.replace(/[ \t]+\n/g, "\n").trim();
}
