"use client";

import { useState } from "react";
import { ArrowUp, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useT } from "@/components/i18n/locale-provider";

export interface ClarifyAnswer {
  question: string;
  answer: string;
}

interface ClarifyChatProps {
  idea: string;
  questions: string[];
  onComplete: (answers: ClarifyAnswer[]) => void;
}

// Chat-like UI: the agent asks one clarifying question at a time.
export function ClarifyChat({ idea, questions, onComplete }: ClarifyChatProps) {
  const t = useT();
  const [answers, setAnswers] = useState<ClarifyAnswer[]>([]);
  const [draft, setDraft] = useState("");

  const current = questions[answers.length];

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const answer = draft.trim();
    if (!answer || !current) return;
    const next = [...answers, { question: current, answer }];
    setAnswers(next);
    setDraft("");
    if (next.length === questions.length) onComplete(next);
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold">{t("Bir neçə dəqiqləşdirici sual")}</p>
            <p className="text-sm text-muted-foreground">
              {t("Sual {step} / {total}", { step: Math.min(answers.length + 1, questions.length), total: questions.length })}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onComplete(answers)}>
            {t("Sualları keç")}
          </Button>
        </div>

        <div className="space-y-3">
          <UserBubble text={idea} />
          {answers.map((item) => (
            <div key={item.question} className="space-y-3">
              <AgentBubble text={item.question} />
              <UserBubble text={item.answer} />
            </div>
          ))}
          {current && <AgentBubble text={current} />}
        </div>

        {current && (
          <form onSubmit={submit} className="flex gap-2">
            <Input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("Cavabınızı yazın...")}
              maxLength={2000}
              className="h-11"
            />
            <Button type="submit" size="icon" className="size-11 shrink-0" disabled={!draft.trim()} aria-label={t("Göndər")}>
              <ArrowUp />
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function AgentBubble({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
        <Bot className="size-4" />
      </span>
      <p className="max-w-[80%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm">{text}</p>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
        {text}
      </p>
    </div>
  );
}
