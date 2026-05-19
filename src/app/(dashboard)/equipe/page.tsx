import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { EquipeList } from "@/components/equipe/equipe-list";
import type { Membro } from "@/types";

export default async function EquipePage() {
  const supabase = await createClient();

  const [{ data: membros }, { data: { user } }] = await Promise.all([
    supabase.from("membros").select("*").order("nome"),
    supabase.auth.getUser(),
  ]);

  return (
    <>
      <Header title="Equipe" userEmail={user?.email} />
      <main className="flex-1 p-6 space-y-4">
        <EquipeList membros={(membros as Membro[]) ?? []} />
      </main>
    </>
  );
}
