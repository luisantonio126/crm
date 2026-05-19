import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { TransacoesList } from "@/components/financeiro/transacoes-list";
import type { Transacao, Cliente, Projeto, Membro } from "@/types";

export default async function ContasPagarPage() {
  const supabase = await createClient();
  const [{ data: transacoes }, { data: clientes }, { data: projetos }, { data: membros }, { data: { user } }] = await Promise.all([
    supabase.from("transacoes").select("*").eq("tipo", "despesa").order("data_vencimento"),
    supabase.from("clientes").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("projetos").select("id, nome").order("nome"),
    supabase.from("membros").select("*").eq("ativo", true).order("nome"),
    supabase.auth.getUser(),
  ]);

  return (
    <>
      <Header title="Contas a Pagar" userEmail={user?.email} />
      <main className="flex-1 p-6">
        <TransacoesList
          transacoes={(transacoes as Transacao[]) ?? []}
          clientes={(clientes as Cliente[]) ?? []}
          projetos={(projetos as Projeto[]) ?? []}
          membros={(membros as Membro[]) ?? []}
          tipoFiltro="despesa"
          titulo="Contas a Pagar"
        />
      </main>
    </>
  );
}
