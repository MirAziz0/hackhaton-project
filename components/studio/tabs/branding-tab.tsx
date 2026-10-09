/* eslint-disable @next/next/no-img-element -- generated images come from Supabase Storage or data URIs */
import { ImageIcon, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Branding } from "@/types/database";

export type ImageStatus = "idle" | "loading" | "done" | "error";

interface BrandingTabProps {
  branding: Branding;
  imageStatus: ImageStatus;
  imageNotice: string | null;
  onGenerateImages: () => void;
}

export function BrandingTab({ branding, imageStatus, imageNotice, onGenerateImages }: BrandingTabProps) {
  const hasImages = branding.logo_urls.length > 0 || Boolean(branding.banner_url);
  const loading = imageStatus === "loading";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ad ideyaları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {branding.name_ideas.map((name) => (
              <p key={name} className="rounded-lg border bg-muted/40 px-4 py-3 text-lg font-semibold">
                {name}
              </p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Şüarlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {branding.slogans.map((slogan) => (
              <p key={slogan} className="rounded-lg border bg-muted/40 px-4 py-3 italic">
                “{slogan}”
              </p>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle>Loqo və banner</CardTitle>
            <CardDescription>
              {loading
                ? "Şəkillər yaradılır, bu bir dəqiqəyə qədər çəkə bilər. Digər bölmələrə baxa bilərsiniz."
                : "Süni intellektin brendiniz üçün hazırladığı vizuallar."}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onGenerateImages} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            {hasImages ? "Yenidən yarat" : "Şəkilləri yarat"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {imageNotice && (
            <p
              role={imageStatus === "error" ? "alert" : undefined}
              className={
                imageStatus === "error"
                  ? "rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
                  : "rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800"
              }
            >
              {imageNotice}
            </p>
          )}

          {loading ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="aspect-square" />
                <Skeleton className="aspect-square" />
              </div>
              <Skeleton className="aspect-[12/5]" />
            </div>
          ) : hasImages ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {branding.logo_urls.map((url, index) => (
                  <img
                    key={url}
                    src={url}
                    alt={`Loqo variantı ${index + 1}`}
                    className="aspect-square w-full rounded-xl border bg-white object-contain"
                  />
                ))}
              </div>
              {branding.banner_url && (
                <img
                  src={branding.banner_url}
                  alt="Brend banneri"
                  className="aspect-[12/5] w-full rounded-xl border object-cover"
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-12 text-center">
              <ImageIcon className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Hələ şəkil yaradılmayıb.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
