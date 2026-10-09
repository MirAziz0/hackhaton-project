export const LOCALES = ["en", "az"] as const;
export type Locale = (typeof LOCALES)[number];

// Language shown to a visitor who has not picked one yet.
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "lang";

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}
