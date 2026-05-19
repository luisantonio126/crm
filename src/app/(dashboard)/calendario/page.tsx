import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { CalendarView } from "@/components/calendario/calendar-view";
import type { Evento, Transacao, Projeto, Cliente } from "@/types";

export default async function CalendarioPage() {
  const supabase = await createClient();

  const [
    { data: eventos },
    { data: transacoes },
    { data: projetos },
    { data: clientes },
    { data: { user } },
  ] = await Promise.all([
    supabase.from("eventos").select("*").order("data_inicio"),
    supabase.from("transacoes").select("id, descricao, data_vencimento, status, tipo").eq("status", "pendente"),
    supabase.from("projetos").select("id, nome, data_previsao, status").not("status", "in", "(concluido,cancelado)"),
    supabase.from("clientes").select("id, nome").eq("ativo", true).order("nome"),
    supabase.auth.getUser(),
  ]);

  return (
    <>
      <Header title="Calendário" userEmail={user?.email} />
      <main className="flex-1 p-6">
        <CalendarView
          eventos={(eventos as Evento[]) ?? []}
          transacoes={(transacoes as unknown as Transacao[]) ?? []}
          projetos={(projetos as unknown as Projeto[]) ?? []}
          clientes={(clientes as Cliente[]) ?? []}
        />
      </main>
    </>
  );
}
