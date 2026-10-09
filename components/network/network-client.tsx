"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Sparkles, Users } from "lucide-react";
import { EntrepreneurCard } from "@/components/network/entrepreneur-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TRACKS } from "@/lib/constants";
import { fallbackMatches, matchCandidates, type Match, type PublicProfile } from "@/lib/network";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/components/i18n/locale-provider";

// How long an AI ranking stays valid in this browser before it is computed again.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

interface CachedMatches {
  savedAt: number;
  matches: Match[];
}

interface NetworkClientProps {
  me: PublicProfile;
  directory: PublicProfile[];
}

export function NetworkClient({ me, directory }: NetworkClientProps) {
  const t = useT();
  const locale = useLocale();
  // The reasons are written in one language, so each language keeps its own cached ranking.
  const cacheKey = `launchlens-matches-${me.id}-${locale}`;

  // Shown immediately: the rule-based order, computed in the browser from data already on the
  // page. The AI ranking replaces it as soon as it arrives, so the section is never empty.
  const instant = useMemo(() => fallbackMatches(me, matchCandidates(me, directory), t), [me, directory, t]);

  const [aiMatches, setAiMatches] = useState<Match[] | null>(null);
  const [refining, setRefining] = useState(false);
  const [failed, setFailed] = useState(false);
  const [track, setTrack] = useState("all");

  const load = useCallback(
    async (force: boolean) => {
      setFailed(false);
      if (!force) {
        try {
          const cached = JSON.parse(localStorage.getItem(cacheKey) ?? "null") as CachedMatches | null;
          if (cached && Date.now() - cached.savedAt < CACHE_TTL_MS && cached.matches.length) {
            setAiMatches(cached.matches);
            return;
          }
        } catch {
          // ignore a broken cache entry and fetch again
        }
      }
      setRefining(true);
      try {
        const response = await fetch("/api/matching");
        const json = (await response.json().catch(() => null)) as { matches?: Match[] } | null;
        if (!response.ok || !json?.matches) throw new Error("matching failed");
        // Only a real AI ranking replaces the instant list and gets cached.
        if (json.matches.some((match) => match.ai)) {
          setAiMatches(json.matches);
          try {
            localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), matches: json.matches }));
          } catch {
            // storage may be unavailable; the page still works without the cache
          }
        } else {
          setFailed(true);
        }
      } catch {
        setFailed(true);
      } finally {
        setRefining(false);
      }
    },
    [cacheKey],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const matches = aiMatches ?? instant;
  const availableTracks = useMemo(
    () => TRACKS.filter((item) => directory.some((profile) => profile.track === item.value)),
    [directory],
  );
  const filtered = track === "all" ? directory : directory.filter((profile) => profile.track === track);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{t("Sizə uyğun sahibkarlar")}</h2>
            <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground" aria-live="polite">
              {refining ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {t("Süni intellekt tövsiyələri dəqiqləşdirir…")}
                </>
              ) : aiMatches ? (
                <>
                  <Sparkles className="size-3.5 text-primary" />
                  {t("Süni intellekt profilinizə əsasən ən faydalı əlaqələri seçib və səbəbini izah edir.")}
                </>
              ) : failed ? (
                t("AI tövsiyəsi hazırda əlçatan deyil, sahə və şəhərə görə sıralama göstərilir.")
              ) : (
                t("Sahə və şəhərə görə ilkin sıralama.")
              )}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load(true)} disabled={refining}>
            <RefreshCw className={cn(refining && "animate-spin")} />
            {t("Yenilə")}
          </Button>
        </div>

        {matches.length ? (
          <div className={cn("grid gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5", refining && "opacity-80")}>
            {matches.map((match) => (
              <EntrepreneurCard key={match.profile.id} profile={match.profile} reason={match.reason} />
            ))}
          </div>
        ) : (
          <EmptyState text={t("Sahənizə uyğun sahibkar hələ tapılmadı. Aşağıdakı siyahıya baxın.")} />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-semibold">{t("Bütün sahibkarlar")}</h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("Sahə üzrə filtr")}>
            {[{ value: "all", label: t("Hamısı") }, ...availableTracks].map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={track === item.value}
                onClick={() => setTrack(item.value)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                  track === item.value
                    ? "border-primary bg-primary font-medium text-primary-foreground"
                    : "bg-card hover:border-primary/50",
                )}
              >
                {t(item.label)}
              </button>
            ))}
          </div>
        </div>

        {filtered.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((profile) => (
              <EntrepreneurCard key={profile.id} profile={profile} />
            ))}
          </div>
        ) : (
          <EmptyState text={t("Hələ başqa sahibkar qeydiyyatdan keçməyib.")} />
        )}
      </section>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
        <Users className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}
