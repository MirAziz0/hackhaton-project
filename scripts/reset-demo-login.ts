// Fallback for the demo login: resets the demo user's password through the Supabase
// admin API. Run `npm run seed:demo` if "Demo hesabı ilə daxil ol" fails after seeding.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";
const DEMO_PASSWORD = "demo12345";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.updateUserById(DEMO_USER_ID, {
    password: DEMO_PASSWORD,
    email_confirm: true,
  });
  if (error) {
    throw new Error(`${error.message}. Did you run supabase/seed.sql in the SQL editor?`);
  }

  console.log(`Demo login is ready: ${data.user.email} / ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
