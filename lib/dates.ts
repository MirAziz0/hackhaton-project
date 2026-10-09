import { sourceText, type Translate } from "@/lib/i18n/translate";

// Date helpers. Dates are handled as "YYYY-MM-DD" strings and months as "YYYY-MM" keys,
// which avoids timezone surprises when comparing transaction dates.
// Month names are Azerbaijani; pass a translator to get them in the visitor's language.

const MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
  "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
];
const MONTHS_SHORT = ["Yan", "Fev", "Mar", "Apr", "May", "İyn", "İyl", "Avq", "Sen", "Okt", "Noy", "Dek"];

// Today's date in Baku, regardless of the server's timezone.
export function todayInBaku() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Baku" }).format(new Date());
}

export function monthKey(date: string) {
  return date.slice(0, 7);
}

export function addMonths(key: string, delta: number) {
  const [year, month] = key.split("-").map(Number);
  const total = year * 12 + (month - 1) + delta;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

export function monthsBetween(fromKey: string, toKey: string) {
  const [fromYear, fromMonth] = fromKey.split("-").map(Number);
  const [toYear, toMonth] = toKey.split("-").map(Number);
  return (toYear - fromYear) * 12 + (toMonth - fromMonth);
}

export function lastDayOfMonth(key: string) {
  const [year, month] = key.split("-").map(Number);
  return `${key}-${String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, "0")}`;
}

export function monthLabel(key: string, t: Translate = sourceText) {
  const [year, month] = key.split("-").map(Number);
  return `${t(MONTHS[month - 1])} ${year}`;
}

export function monthShortLabel(key: string, t: Translate = sourceText) {
  return t(MONTHS_SHORT[Number(key.split("-")[1]) - 1]);
}

// Accepts "YYYY-MM-DD" or a full ISO timestamp. Deterministic on server and client alike.
export function formatDate(date: string, t: Translate = sourceText) {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  const name = t(MONTHS[month - 1]);
  return t("{day} {monthLower} {year}", { day, month: name, monthLower: name.toLowerCase(), year });
}
