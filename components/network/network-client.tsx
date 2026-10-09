"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Users } from "lucide-react";
import { EntrepreneurCard } from "@/components/network/entrepreneur-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TRACKS } from "@/lib/constants";
import type { Match, PublicProfile } from "@/lib/network";
import { cn } from "@/lib/utils";

const GENERIC_ERROR = "Tövsiyələri yükləmək mümkün olmadı. Zəhmət olmasa yenidən cəhd edin.";

interface NetworkClientProps {
  userId: string;
  directory: PublicProfile[];
}

export function NetworkClient({ userId, directory }: NetworkClientProps) {
  const cacheKey = `launchlens-matches-${userId}`;
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [track, setTrack] = useState("all");

  // The AI ranking costs a model call, so it is kept for the browser session and only
  // recomputed when the user asks for it.
  const load = useCallback(
    async (force: boolean) => {
      setError(null);
      if (!force) {
        try {
          const cached = sessionStorage.getItem(cacheKey);
          if (cached) {
            setMatches(JSON.parse(cached) as Match[]);
            setLoading(false);
            return;
          }
        } catch {
          // ignore a broken cache entry and fetch again
        }
      }
      setLoading(true);
      try {
        const response = await fetch("/api/matching");
        const json = (await response.json().catch(() => null)) as { matches?: Match[]; error?: string } | null;
        if (!response.ok || !json?.matches) throw new Error(json?.error ?? GENERIC_ERROR);
        setMatches(json.matches);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(json.matches));
        } catch {
          // storage may be unavailable; the page still works without the cache
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : GENERIC_ERROR);
      } finally {
        setLoading(false);
      }
    },
    [cacheKey],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const availableTracks = useMemo(
    () => TRACKS.filter((item) => directory.some((profile) => profile.track === item.value)),
    [directory],
  );
  const filtered = track === "all" ? directory : directory.filter((profile) => profile.track === track);
  const usedFallback = matches?.some((match) => !match.ai) ?? false;

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Sizə uyğun sahibkarlar</h2>
            <p className="text-sm text-muted-foreground">
              Süni intellekt profilinizə əsasən ən faydalı əlaqələri seçir və səbəbini izah edir.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load(true)} disabled={loading}>
            <RefreshCw className={cn(loading && "animate-spin")} />
            Yenilə
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-64" />
            ))}
          </div>
        ) : error ? (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : matches?.length ? (
          <>
            {usedFallback && (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                AI tövsiyəsi hazırda əlçatan deyil, ona görə sahə və şəhərə görə sıralama göstərilir.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
              {matches.map((match) => (
                <EntrepreneurCard key={match.profile.id} profile={match.profile} reason={match.reason} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState text="Sahənizə uyğun sahibkar hələ tapılmadı. Aşağıdakı siyahıya baxın." />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-semibold">Bütün sahibkarlar</h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Sahə üzrə filtr">
            {[{ value: "all", label: "Hamısı" }, ...availableTracks].map((item) => (
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
                {item.label}
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
          <EmptyState text="Hələ başqa sahibkar qeydiyyatdan keçməyib." />
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
