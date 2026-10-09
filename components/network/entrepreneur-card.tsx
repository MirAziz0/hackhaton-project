import Link from "next/link";
import { MapPin, Sparkles } from "lucide-react";
import { ContactButton } from "@/components/network/contact-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { lookingForLabel, stageLabel, trackLabel } from "@/lib/constants";
import type { PublicProfile } from "@/lib/network";
import { initials } from "@/lib/utils";

interface EntrepreneurCardProps {
  profile: PublicProfile;
  // One-sentence reason from the Matching agent; omitted in the plain directory list.
  reason?: string;
}

export function EntrepreneurCard({ profile, reason }: EntrepreneurCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-base font-semibold text-primary">
            {initials(profile.full_name)}
          </span>
          <div className="min-w-0 flex-1">
            <Link href={`/profile/${profile.id}`} className="block truncate font-semibold hover:text-primary hover:underline">
              {profile.full_name || "Sahibkar"}
            </Link>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{profile.city || "—"}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge>{trackLabel(profile.track)}</Badge>
          <Badge variant="outline">{stageLabel(profile.stage)}</Badge>
        </div>

        {reason ? (
          <p className="flex gap-2 rounded-lg bg-secondary px-3 py-2.5 text-sm text-secondary-foreground">
            <Sparkles className="mt-0.5 size-4 shrink-0" />
            {reason}
          </p>
        ) : (
          profile.bio && <p className="line-clamp-3 text-sm text-muted-foreground">{profile.bio}</p>
        )}

        {profile.looking_for?.length > 0 && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Axtarır: </span>
            {profile.looking_for.map(lookingForLabel).join(", ")}
          </p>
        )}

        <ContactButton userId={profile.id} variant={reason ? "default" : "outline"} className="mt-auto w-full" />
      </CardContent>
    </Card>
  );
}
