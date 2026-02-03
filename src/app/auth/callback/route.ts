import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // If the user just confirmed their email after signup,
    // create their company + profile from stored metadata
    if (data?.session?.user) {
      const user = data.session.user;
      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      // No profile yet — this is a post-signup confirmation
      if (!profile) {
        const meta = user.user_metadata;
        await supabase.rpc("create_user_account", {
          p_company_name: meta?.company_name || "My Company",
          p_full_name: meta?.full_name || undefined,
        });
      }
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
