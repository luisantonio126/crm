import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RelatoriosClient } from "@/components/relatorios/relatorios-client";
import { gerarNotificacoes } from "@/lib/notificacoes";
import type { Transacao, Cliente, Projeto } from "@/types";

export default async function RelatoriosPage() {
  const supabase = await createClient();

  const [
    { data: transacoes },
    { data: clientes },
    { data: projetos },
    { data: { user } },
  ] = await Promise.all([
    supabase.from("transacoes").select("*").order("data_vencimento"),
    supabase.from("clientes").select("*").order("nome"),
    supabase.from("projetos").select("*, clientes(nome)").order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  const tx = (transacoes as Transacao[]) ?? [];
  const notifTransacoes = tx.filter((t) => t.status === "pendente");
  const notifProjetos = (projetos as Projeto[]) ?? [];
  const notificacoes = gerarNotificacoes(notifTransacoes, notifProjetos);

  return (
    <>
      <Header title="Relatórios" userEmail={user?.email} notificacoes={notificacoes} />
      <main className="flex-1 p-6">
        <RelatoriosClient
          transacoes={tx}
          clientes={(clientes as Cliente[]) ?? []}
          projetos={(projetos as unknown as (Projeto & { clientes: { nome: string } | null })[]) ?? []}
        />
      </main>
    </>
  );
}
