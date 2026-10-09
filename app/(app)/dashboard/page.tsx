import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { todayInBaku } from "@/lib/dates";
import { getAuth, getSessionProfile } from "@/lib/supabase/server";
import type { FinancialForecast, Transaction } from "@/types/database";

export const metadata = { title: "Dashboard — Growenta" };

interface BusinessRow {
  id: string;
  name: string;
  financial_forecast: FinancialForecast | null;
  transactions: Transaction[];
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ business?: string }>;
}) {
  const { business: requestedId } = await searchParams;
  const { supabase, user } = await getAuth();
  if (!user) redirect("/login");

  // One round trip of latency: the profile and the businesses (with transactions) in parallel.
  const [{ profile }, { data: businessRows }] = await Promise.all([
    getSessionProfile(),
    supabase
      .from("businesses")
      .select("id, name, financial_forecast, transactions(*)")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
  ]);
  const businesses = (businessRows as BusinessRow[] | null) ?? [];

  const header = (
    <PageHeader title="Dashboard" description="Gəlir və xərclərinizi izləyin, AI köməkçidən məsləhət alın." />
  );

  if (!businesses.length) {
    return (
      <>
        {header}
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
              <LayoutDashboard className="size-7" />
            </span>
            <p className="text-lg font-medium">Hələ biznesiniz yoxdur</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Əvvəlcə Studiyada biznes planı yaradın və “Dashboard-a əlavə et” düyməsini basın.
            </p>
            <Link href="/studio" className={buttonVariants({ className: "mt-2" })}>
              Studiyaya keç
            </Link>
          </CardContent>
        </Card>
      </>
    );
  }

  const business = businesses.find((item) => item.id === requestedId) ?? businesses[0];
  const transactions = [...(business.transactions ?? [])].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      {/* The key resets all client state when another business is selected. */}
      <DashboardClient
        key={business.id}
        userName={profile?.full_name?.trim().split(" ")[0] || "sahibkar"}
        businesses={businesses.map(({ id, name }) => ({ id, name }))}
        business={{ id: business.id, name: business.name, financial_forecast: business.financial_forecast }}
        initialTransactions={transactions}
        today={todayInBaku()}
      />
    </>
  );
}
