import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-lg space-y-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Your communities will appear here. This is the foundation of Mutual
          &mdash; a platform where communities commission, own, and govern
          their own software.
        </p>
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No communities yet. Community creation is coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
