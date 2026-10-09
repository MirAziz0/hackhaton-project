/* eslint-disable @next/next/no-img-element -- logos come from Supabase Storage or data URIs */
import { notFound } from "next/navigation";
import { Briefcase, MapPin, Package, Target, Wallet, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ContactButton } from "@/components/network/contact-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { budgetLabel, lookingForLabel, stageLabel, trackLabel } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuth } from "@/lib/supabase/server";
import { initials } from "@/lib/utils";
import type { Branding, Profile } from "@/types/database";

export const metadata = { title: "Profil — LaunchLens AI" };

interface BusinessCard {
  id: string;
  name: string;
  logo: string | null;
}

// Business rows are private (owner-only RLS), but a profile shows each business's name and
// logo. This reads just those two fields with the service role, and only after the profile
// itself was fetched through RLS, which proves the viewer is signed in.
async function loadBusinessCards(ownerId: string): Promise<BusinessCard[]> {
  try {
    const { data } = await createAdminClient()
      .from("businesses")
      .select("id, name, branding")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(12);
    return ((data as { id: string; name: string; branding: Branding | null }[] | null) ?? []).map((business) => ({
      id: business.id,
      name: business.name,
      logo: business.branding?.logo_urls?.[0] ?? null,
    }));
  } catch (err) {
    console.error("[profile] could not load businesses:", err instanceof Error ? err.message : err);
    return [];
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuth();
  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();

  const profile = data as Profile | null;
  if (!profile) notFound();
  const isOwn = user?.id === profile.id;
  const businesses = await loadBusinessCards(profile.id);

  return (
    <>
      <PageHeader title={isOwn ? "Profilim" : "Profil"} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="size-24 rounded-full object-cover" />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-full bg-secondary text-3xl font-semibold text-primary">
                {initials(profile.full_name)}
              </div>
            )}
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">{profile.full_name || "İstifadəçi"}</h2>
              <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                {profile.city || "—"}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge>{trackLabel(profile.track)}</Badge>
              <Badge variant="outline">{stageLabel(profile.stage)}</Badge>
            </div>
            {!isOwn && <ContactButton userId={profile.id} className="mt-2 w-full" />}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Haqqında</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-relaxed">{profile.bio || "Hələ məlumat əlavə edilməyib."}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow icon={Package} label="Məhsul və xidmətlər" value={profile.products} />
                <InfoRow icon={Target} label="Hədəf müştəri" value={profile.target_customer} />
                {isOwn && <InfoRow icon={Wallet} label="Büdcə (yalnız siz görürsünüz)" value={budgetLabel(profile.budget_range)} />}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nə axtarır</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {profile.looking_for?.length ? (
                profile.looking_for.map((item) => <Badge key={item}>{lookingForLabel(item)}</Badge>)
              ) : (
                <p className="text-sm text-muted-foreground">Göstərilməyib.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Biznesləri</CardTitle>
            </CardHeader>
            <CardContent>
              {businesses.length ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {businesses.map((business) => (
                    <li key={business.id} className="flex items-center gap-3 rounded-lg border p-3">
                      {business.logo ? (
                        <img src={business.logo} alt="" className="size-11 shrink-0 rounded-lg border bg-white object-contain" />
                      ) : (
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                          <Briefcase className="size-5" />
                        </span>
                      )}
                      <span className="min-w-0 truncate font-medium">{business.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isOwn ? "Hələ biznes əlavə etməmisiniz. Studiyada plan yaradıb yadda saxlayın." : "Hələ biznes əlavə edilməyib."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | null }) {
  return (
    <div className="flex gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}
