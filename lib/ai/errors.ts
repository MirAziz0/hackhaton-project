import { sourceText, type Translate } from "@/lib/i18n/translate";

// Error with a message that is safe and friendly enough to show to the user. The message is
// the Azerbaijani source text; toUserError translates it, filling "{name}" from `values`.
export class AiError extends Error {
  constructor(
    public userMessage: string,
    public status = 500,
    detail?: string,
    public values?: Record<string, string>,
  ) {
    super(detail ?? userMessage);
    this.name = "AiError";
  }
}

export const AI_GENERIC_ERROR =
  "Süni intellekt cavab verə bilmədi. Zəhmət olmasa bir az sonra yenidən cəhd edin.";

export function toUserError(err: unknown, t: Translate = sourceText): { message: string; status: number } {
  if (err instanceof AiError) return { message: t(err.userMessage, err.values), status: err.status };
  console.error("[ai] unexpected error:", err);
  return { message: t(AI_GENERIC_ERROR), status: 500 };
}
