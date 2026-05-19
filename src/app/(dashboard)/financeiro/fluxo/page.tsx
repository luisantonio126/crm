import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransacoesList } from "@/components/financeiro/transacoes-list";
import { FluxoChart } from "@/components/financeiro/fluxo-chart";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import type { Transacao, Cliente, Projeto, Membro } from "@/types";

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

export default async function FluxoCaixaPage() {
  const supabase = await createClient();
  const [{ data: transacoes }, { data: clientes }, { data: projetos }, { data: membros }, { data: { user } }] = await Promise.all([
    supabase.from("transacoes").select("*").order("data_vencimento", { ascending: false }),
    supabase.from("clientes").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("projetos").select("id, nome").order("nome"),
    supabase.from("membros").select("id, nome").eq("ativo", true).order("nome"),
    supabase.auth.getUser(),
  ]);

  const tx = (transacoes as Transacao[]) ?? [];
  const totalReceitas = tx.filter((t) => t.tipo === "receita" && t.status === "pago").reduce((s, t) => s + t.valor, 0);
  const totalDespesas = tx.filter((t) => t.tipo === "despesa" && t.status === "pago").reduce((s, t) => s + t.valor, 0);
  const saldo = totalReceitas - totalDespesas;
  const dadosMensais = gerarDadosMensais(tx);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <>
      <Header title="Fluxo de Caixa" userEmail={user?.email} />
      <main className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Receitas Recebidas</CardTitle>
              <div className="p-1.5 rounded-md bg-green-400/10"><TrendingUp className="w-4 h-4 text-green-400" /></div>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold text-green-400">{fmt(totalReceitas)}</p></CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Despesas Pagas</CardTitle>
              <div className="p-1.5 rounded-md bg-red-400/10"><TrendingDown className="w-4 h-4 text-red-400" /></div>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold text-red-400">{fmt(totalDespesas)}</p></CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
              <div className={`p-1.5 rounded-md ${saldo >= 0 ? "bg-primary/10" : "bg-destructive/10"}`}>
                <Wallet className={`w-4 h-4 ${saldo >= 0 ? "text-primary" : "text-destructive"}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${saldo >= 0 ? "text-primary" : "text-destructive"}`}>{fmt(saldo)}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Evolução dos últimos 6 meses</CardTitle>
          </CardHeader>
          <CardContent><FluxoChart dados={dadosMensais} /></CardContent>
        </Card>

        <TransacoesList
          transacoes={tx}
          clientes={(clientes as Cliente[]) ?? []}
          projetos={(projetos as Projeto[]) ?? []}
          membros={(membros as Membro[]) ?? []}
          titulo="Todos os Lançamentos"
        />
      </main>
    </>
  );
}
