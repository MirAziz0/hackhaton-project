import { BarChart3, Lightbulb, Users } from "lucide-react";
import { Logo } from "@/components/layout/logo";

const HIGHLIGHTS = [
  { icon: Lightbulb, text: "İdeyanızı dəqiqələr içində biznes plana çevirin" },
  { icon: BarChart3, text: "Real bazar məlumatları ilə planınızı təhlil edin" },
  { icon: Users, text: "Eyni sahədəki sahibkarlarla əlaqə qurun" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-sidebar p-12 text-white lg:flex">
        <Logo dark />
        <div className="space-y-8">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            İdeyadan işlək biznesə — hər addımda süni intellekt dəstəyi
          </h1>
          <ul className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sidebar-foreground">
                <span className="flex size-9 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="size-4 text-white" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-sidebar-foreground/70">
          Sahibkarlar, banklar və inkubatorlar üçün
        </p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Logo className="mb-8 lg:hidden" />
          {children}
        </div>
      </div>
    </div>
  );
}
