import { Megaphone, Smartphone, Store, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BusinessPlan } from "@/types/database";

export function IdeasTab({ ideas }: { ideas: BusinessPlan["extra_ideas"] }) {
  if (!ideas) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Bu plan üçün əlavə ideya yoxdur.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <IdeaList icon={Megaphone} title="Kampaniya ideyaları" items={ideas.campaigns} />
      <IdeaList icon={Smartphone} title="Sosial media paylaşımları" items={ideas.social_posts} />
      <Card className="lg:col-span-2">
        <CardHeader className="flex-row items-center gap-3">
          <IconBadge icon={Store} />
          <CardTitle>Pop-up mağaza ideyası</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed">{ideas.popup_store}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function IconBadge({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
      <Icon className="size-4" />
    </span>
  );
}

function IdeaList({ icon, title, items }: { icon: LucideIcon; title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <IconBadge icon={icon} />
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item} className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
