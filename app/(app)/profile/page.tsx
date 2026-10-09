import { redirect } from "next/navigation";
import { getAuth } from "@/lib/supabase/server";

export default async function OwnProfilePage() {
  const { user } = await getAuth();

  if (!user) redirect("/login");
  redirect(`/profile/${user.id}`);
}
