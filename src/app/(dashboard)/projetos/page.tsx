import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { KanbanBoard } from "@/components/projetos/kanban-board";
import type { Projeto, Cliente } from "@/types";

export default async function ProjetosPage() {
  const supabase = await createClient();

  const [{ data: projetos }, { data: clientes }, { data: { user } }] = await Promise.all([
    supabase.from("projetos").select("*").order("created_at", { ascending: false }),
    supabase.from("clientes").select("id, nome").eq("ativo", true).order("nome"),
    supabase.auth.getUser(),
  ]);

  return (
    <>
      <Header title="Projetos" userEmail={user?.email} />
      <main className="flex-1 p-6 overflow-hidden">
        <KanbanBoard
          projetos={(projetos as Projeto[]) ?? []}
          clientes={(clientes as Cliente[]) ?? []}
        />
      </main>
    </>
  );
}
