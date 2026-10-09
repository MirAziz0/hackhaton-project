import { notFound } from "next/navigation";
import { MapPin, Target, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { budgetLabel, lookingForLabel, stageLabel, trackLabel } from "@/lib/constants";
import { getAuth } from "@/lib/supabase/server";
import { initials } from "@/lib/utils";
import type { Profile } from "@/types/database";

export const metadata = { title: "Profil — LaunchLens AI" };

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuth();
  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();

  const profile = data as Profile | null;
  if (!profile) notFound();
  const isOwn = user?.id === profile.id;

  return (
    <>
      <PageHeader title={isOwn ? "Profilim" : "Profil"} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex size-24 items-center justify-center rounded-full bg-secondary text-3xl font-semibold text-primary">
              {initials(profile.full_name)}
            </div>
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
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Haqqında</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-relaxed">
                {profile.bio || "Hələ məlumat əlavə edilməyib."}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow icon={Target} label="Məhsul və xidmətlər" value={profile.products} />
                <InfoRow icon={Target} label="Hədəf müştəri" value={profile.target_customer} />
                {isOwn && (
                  <InfoRow icon={Wallet} label="Büdcə" value={budgetLabel(profile.budget_range)} />
                )}
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
        </div>
      </div>
    </>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: string | null;
}) {
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
