import type { SourceReference } from "@/types/analysis";

const MARKER = /(\[[MW]\d+\])/g;

interface CitedTextProps {
  text: string;
  references: SourceReference[];
}

// Renders "[M3]" / "[W1]" markers in agent text as small links to the cited source.
export function CitedText({ text, references }: CitedTextProps) {
  const parts = text.split(MARKER);

  return (
    <>
      {parts.map((part, index) => {
        const id = /^\[([MW]\d+)\]$/.exec(part)?.[1];
        if (!id) return <span key={index}>{part}</span>;

        const reference = references.find((item) => item.id === id);
        if (!reference) return null;
        return <SourceBadge key={index} reference={reference} />;
      })}
    </>
  );
}

export function SourceBadge({ reference }: { reference: SourceReference }) {
  const className =
    "mx-0.5 inline-flex items-center rounded bg-secondary px-1.5 py-0.5 align-baseline text-[11px] font-semibold text-secondary-foreground";
  const title = `${reference.name} — ${reference.detail}`;

  if (!reference.url) {
    return (
      <span className={className} title={title}>
        {reference.id}
      </span>
    );
  }
  return (
    <a
      href={reference.url}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className={`${className} hover:bg-primary hover:text-primary-foreground`}
    >
      {reference.id}
    </a>
  );
}

export function PlanBadge() {
  return (
    <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
      plandan
    </span>
  );
}

export function EstimateBadge() {
  return (
    <span className="inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">
      təxmini
    </span>
  );
}
