import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, KanbanSquare, TrendingUp, AlertCircle, UserCircle2 } from "lucide-react";
import { FluxoChart } from "@/components/financeiro/fluxo-chart";
import { gerarNotificacoes } from "@/lib/notificacoes";
import type { Transacao, Membro } from "@/types";

function gerarDadosMensais(transacoes: Transacao[]) {
  const meses: Record<string, { receitas: number; despesas: number }> = {};
  const hoje = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const key = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    meses[key] = { receitas: 0, despesas: 0 };
  }
  transacoes.filter((t) => t.status === "pago").forEach((t) => {
    const d = new Date(t.data_pagamento || t.data_vencimento);
    const key = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    if (meses[key] !== undefined) {
      if (t.tipo === "receita") meses[key].receitas += t.valor;
      else meses[key].despesas += t.valor;
    }
  });
  return Object.entries(meses).map(([mes, v]) => ({
    mes, receitas: v.receitas, despesas: v.despesas, saldo: v.receitas - v.despesas,
  }));
}

const statusLabel: Record<string, string> = {
  backlog: "Backlog", em_andamento: "Em Andamento", revisao: "Revisão",
  concluido: "Concluído", cancelado: "Cancelado",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const hoje = new Date();
  const em7dias = new Date(hoje); em7dias.setDate(hoje.getDate() + 7);

  const [
    { count: totalClientes },
    { data: projetos },
    { data: transacoes },
    { data: membros },
    { data: todosProjetos },
    { data: { user } },
  ] = await Promise.all([
    supabase.from("clientes").select("*", { count: "exact", head: true }).eq("ativo", true),
    supabase.from("projetos").select("id, nome, status, cliente_id, data_previsao").not("status", "in", "(concluido,cancelado)").order("created_at", { ascending: false }).limit(5),
    supabase.from("transacoes").select("*").order("data_vencimento"),
    supabase.from("membros").select("*").eq("ativo", true).order("nome"),
    supabase.from("projetos").select("id, membro_id").not("status", "in", "(cancelado)"),
    supabase.auth.getUser(),
  ]);

  const tx = (transacoes as Transacao[]) ?? [];
  const receitaMes = tx
    .filter((t) => t.tipo === "receita" && t.status === "pago" &&
      new Date(t.data_pagamento || t.data_vencimento).getMonth() === hoje.getMonth() &&
      new Date(t.data_pagamento || t.data_vencimento).getFullYear() === hoje.getFullYear())
    .reduce((s, t) => s + t.valor, 0);

  const aVencer = tx.filter((t) =>
    t.status === "pendente" &&
    new Date(t.data_vencimento) >= hoje &&
    new Date(t.data_vencimento) <= em7dias
  ).length;

  const dadosMensais = gerarDadosMensais(tx);
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const membrosAtivos = (membros as Membro[]) ?? [];
  const resumoEquipe = membrosAtivos.map((m) => {
    const servicos = (todosProjetos ?? []).filter((p) => p.membro_id === m.id).length;
    const faturado = tx
      .filter((t) => t.tipo === "receita" && t.status === "pago" && t.membro_id === m.id)
      .reduce((s, t) => s + t.valor, 0);
    const aReceber = tx
      .filter((t) => t.tipo === "receita" && t.status === "pendente" && t.membro_id === m.id)
      .reduce((s, t) => s + t.valor, 0);
    return { ...m, servicos, faturado, aReceber };
  });

  const notificacoes = gerarNotificacoes(
    tx.filter((t) => t.status === "pendente"),
    projetos ?? []
  );

  return (
    <>
      <Header title="Dashboard" userEmail={user?.email} notificacoes={notificacoes} />
      <main className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Ativos</CardTitle>
              <div className="p-1.5 rounded-md bg-primary/10"><Users className="w-4 h-4 text-primary" /></div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalClientes ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">clientes cadastrados</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Projetos Ativos</CardTitle>
              <div className="p-1.5 rounded-md bg-primary/10"><KanbanSquare className="w-4 h-4 text-primary" /></div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{projetos?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">em andamento</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Receita do Mês</CardTitle>
              <div className="p-1.5 rounded-md bg-green-400/10"><TrendingUp className="w-4 h-4 text-green-400" /></div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-400">{fmt(receitaMes)}</p>
              <p className="text-xs text-muted-foreground mt-1">recebido no mês</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Contas a Vencer</CardTitle>
              <div className={`p-1.5 rounded-md ${aVencer > 0 ? "bg-destructive/10" : "bg-primary/10"}`}>
                <AlertCircle className={`w-4 h-4 ${aVencer > 0 ? "text-destructive" : "text-primary"}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{aVencer}</p>
              <p className="text-xs text-muted-foreground mt-1">nos próximos 7 dias</p>
            </CardContent>
          </Card>
        </div>

        {resumoEquipe.length > 0 && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserCircle2 className="w-4 h-4 text-primary" />
                Resumo da Equipe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {resumoEquipe.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                    <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <UserCircle2 className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.nome}</p>
                      {m.cargo && <p className="text-[11px] text-muted-foreground">{m.cargo}</p>}
                    </div>
                    <div className="flex items-center gap-4 text-right shrink-0">
                      <div>
                        <p className="text-xs text-muted-foreground">Serviços</p>
                        <p className="text-sm font-semibold">{m.servicos}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Faturado</p>
                        <p className="text-sm font-semibold text-green-400">{fmt(m.faturado)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">A Receber</p>
                        <p className="text-sm font-semibold text-yellow-400">{fmt(m.aReceber)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Fluxo de Caixa — últimos 6 meses
              </CardTitle>
            </CardHeader>
            <CardContent><FluxoChart dados={dadosMensais} /></CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <KanbanSquare className="w-4 h-4 text-primary" />
                Projetos em Andamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!projetos || projetos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum projeto ativo</p>
              ) : (
                <div className="space-y-2">
                  {projetos.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                      <p className="text-sm font-medium truncate flex-1">{p.nome}</p>
                      <Badge variant="secondary" className="text-xs ml-2 shrink-0">
                        {statusLabel[p.status]}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
