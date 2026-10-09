import type { Locale } from "@/lib/i18n/config";
import { en } from "@/lib/i18n/en";

export type Translate = (text: string, values?: Record<string, string | number>) => string;

// The Azerbaijani text in the code is the key: Azerbaijani returns it unchanged and English
// looks it up in en.ts. "{name}" placeholders are filled from `values` in both languages.
// When one Azerbaijani word needs two English meanings, a "##context" suffix tells them apart
// ("İmkanlar" = Features, "İmkanlar##swot" = Opportunities); the suffix is never shown.
export function createTranslator(locale: Locale): Translate {
  return (text, values) => {
    const source = text.split("##")[0];
    const template = locale === "en" ? (en[text] ?? source) : source;
    if (!values) return template;
    return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
      name in values ? String(values[name]) : placeholder,
    );
  };
}

// For helpers that take an optional translator: keeps the Azerbaijani source text.
export const sourceText = createTranslator("az");
