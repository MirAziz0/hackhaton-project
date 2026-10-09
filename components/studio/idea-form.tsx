"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/components/i18n/locale-provider";

const EXAMPLES = [
  "Bakıda təbii tərkibli əl işi sabunlar və şamlar satan kiçik mağaza açmaq istəyirəm.",
  "Ofis işçiləri üçün sağlam nahar yeməklərinin abunə ilə çatdırılması xidməti.",
  "Kiçik bizneslər üçün Instagram mağazası quran və idarə edən rəqəmsal agentlik.",
];

interface IdeaFormProps {
  initialIdea?: string;
  loading: boolean;
  error: string | null;
  onSubmit: (idea: string) => void;
}

export function IdeaForm({ initialIdea = "", loading, error, onSubmit }: IdeaFormProps) {
  const t = useT();
  const [idea, setIdea] = useState(initialIdea);
  const tooShort = idea.trim().length < 10;

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="space-y-1.5">
          <label htmlFor="idea" className="text-lg font-semibold">
            {t("Biznes ideyanızı yazın")}
          </label>
          <p className="text-sm text-muted-foreground">
            {t("Bir-iki cümlə kifayətdir. Profilinizdəki məlumatları (sahə, büdcə, məkan) artıq bilirik.")}
          </p>
        </div>

        <Textarea
          id="idea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder={t("Məsələn: Bakıda təbii tərkibli kosmetika mağazası açmaq istəyirəm...")}
          className="min-h-36 text-base"
          maxLength={4000}
          disabled={loading}
        />

        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              disabled={loading}
              onClick={() => setIdea(t(example))}
              className="rounded-full border bg-card px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
            >
              {t(example)}
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <Button size="lg" disabled={tooShort || loading} onClick={() => onSubmit(idea.trim())}>
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {loading ? t("İdeya oxunur...") : t("Plan hazırla")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
