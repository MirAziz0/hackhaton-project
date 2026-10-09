// Error with a message that is safe and friendly enough to show to the user (in Azerbaijani).
export class AiError extends Error {
  constructor(
    public userMessage: string,
    public status = 500,
    detail?: string,
  ) {
    super(detail ?? userMessage);
    this.name = "AiError";
  }
}

export const AI_GENERIC_ERROR =
  "Süni intellekt cavab verə bilmədi. Zəhmət olmasa bir az sonra yenidən cəhd edin.";

export function toUserError(err: unknown): { message: string; status: number } {
  if (err instanceof AiError) return { message: err.userMessage, status: err.status };
  console.error("[ai] unexpected error:", err);
  return { message: AI_GENERIC_ERROR, status: 500 };
}
