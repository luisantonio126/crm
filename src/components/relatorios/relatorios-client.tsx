"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import { Download, TrendingUp, TrendingDown, Users, KanbanSquare } from "lucide-react";
import type { Transacao, Cliente, Projeto } from "@/types";

const CORES = ["#a07040", "#c49060", "#7a5530", "#e0b080", "#604020"];

interface RelatoriosClientProps {
  transacoes: Transacao[];
  clientes: Cliente[];
  projetos: (Projeto & { clientes: { nome: string } | null })[];
}

function exportarCSV(dados: Record<string, unknown>[], nome: string) {
  if (dados.length === 0) return;
  const headers = Object.keys(dados[0]).join(";");
  const rows = dados.map((r) => Object.values(r).map((v) => `"${v ?? ""}"`).join(";"));
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `${nome}.csv`; a.click();
  URL.revokeObjectURL(url);
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function RelatoriosClient({ transacoes, clientes, projetos }: RelatoriosClientProps) {
  const [tab, setTab] = useState("financeiro");

  // KPIs financeiros
  const receitas = transacoes.filter((t) => t.tipo === "receita");
  const despesas = transacoes.filter((t) => t.tipo === "despesa");
  const totalRecebido = receitas.filter((t) => t.status === "pago").reduce((s, t) => s + t.valor, 0);
  const totalPago = despesas.filter((t) => t.status === "pago").reduce((s, t) => s + t.valor, 0);
  const aReceber = receitas.filter((t) => t.status === "pendente").reduce((s, t) => s + t.valor, 0);
  const aPagar = despesas.filter((t) => t.status === "pendente").reduce((s, t) => s + t.valor, 0);

  // Por mês (últimos 6)
  const hoje = new Date();
  const dadosMensais = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1);
    const key = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    const rec = transacoes.filter((t) => t.tipo === "receita" && t.status === "pago" &&
      new Date(t.data_pagamento || t.data_vencimento).getMonth() === d.getMonth() &&
      new Date(t.data_pagamento || t.data_vencimento).getFullYear() === d.getFullYear()
    ).reduce((s, t) => s + t.valor, 0);
    const desp = transacoes.filter((t) => t.tipo === "despesa" && t.status === "pago" &&
      new Date(t.data_pagamento || t.data_vencimento).getMonth() === d.getMonth() &&
      new Date(t.data_pagamento || t.data_vencimento).getFullYear() === d.getFullYear()
    ).reduce((s, t) => s + t.valor, 0);
    return { mes: key, Receitas: rec, Despesas: desp };
  });

  // Por categoria
  const porCategoria = Object.entries(
    transacoes.filter((t) => t.status === "pago").reduce<Record<string, number>>((acc, t) => {
      const cat = t.categoria ?? "Outros";
      acc[cat] = (acc[cat] ?? 0) + t.valor;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);

  // Status de projetos
  const statusCount = projetos.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1; return acc;
  }, {});
  const dadosProjetos = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

  const statusLabel: Record<string, string> = {
    novo_lead: "Novo Lead", avaliacao_marcada: "Avaliação Marcada",
    laudo: "Laudo", finalizado: "Finalizado",
  };

  // Despesas por tipo
  const despesasPorTipo = Object.entries(
    despesas.filter((t) => t.status === "pago").reduce<Record<string, number>>((acc, t) => {
      const tipo = t.categoria ?? "Outros";
      acc[tipo] = (acc[tipo] ?? 0) + t.valor;
      return acc;
    }, {})
  ).map(([tipo, total]) => ({ tipo, total })).sort((a, b) => b.total - a.total);

  // Recebidos por cliente
  const clienteMap = Object.fromEntries(clientes.map((c) => [c.id, c.nome]));
  const recebidosPorCliente = Object.entries(
    receitas.filter((t) => t.status === "pago" && t.cliente_id).reduce<Record<string, { total: number; lancamentos: number }>>((acc, t) => {
      const id = t.cliente_id!;
      if (!acc[id]) acc[id] = { total: 0, lancamentos: 0 };
      acc[id].total += t.valor;
      acc[id].lancamentos += 1;
      return acc;
    }, {})
  )
    .map(([id, v]) => ({ cliente: clienteMap[id] ?? "Desconhecido", ...v }))
    .sort((a, b) => b.total - a.total);

  // Exportações
  function exportarTransacoes() {
    exportarCSV(transacoes.map((t) => ({
      Tipo: t.tipo, Descrição: t.descricao, Valor: t.valor,
      Vencimento: t.data_vencimento, Pagamento: t.data_pagamento ?? "",
      Status: t.status, Categoria: t.categoria ?? "",
    })), "transacoes");
  }

  function exportarClientes() {
    exportarCSV(clientes.map((c) => ({
      Nome: c.nome, Tipo: c.tipo, Email: c.email ?? "",
      Telefone: c.telefone ?? "", Cidade: c.cidade ?? "", Estado: c.estado ?? "",
      Status: c.ativo ? "Ativo" : "Inativo",
    })), "clientes");
  }

  function exportarProjetos() {
    exportarCSV(projetos.map((p) => ({
      Nome: p.nome, Cliente: p.clientes?.nome ?? "",
      Status: statusLabel[p.status] ?? p.status,
      Prioridade: p.prioridade, Início: p.data_inicio ?? "",
      Previsão: p.data_previsao ?? "", Valor: p.valor_contrato ?? "",
    })), "projetos");
  }

  return (
    <div className="space-y-6">
      {/* Botões de exportação */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={exportarTransacoes}>
          <Download className="w-4 h-4" /> Exportar Transações (.csv)
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={exportarClientes}>
          <Download className="w-4 h-4" /> Exportar Clientes (.csv)
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={exportarProjetos}>
          <Download className="w-4 h-4" /> Exportar Projetos (.csv)
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="financeiro" className="gap-2"><TrendingUp className="w-3.5 h-3.5" /> Financeiro</TabsTrigger>
          <TabsTrigger value="projetos" className="gap-2"><KanbanSquare className="w-3.5 h-3.5" /> Projetos</TabsTrigger>
          <TabsTrigger value="clientes" className="gap-2"><Users className="w-3.5 h-3.5" /> Clientes</TabsTrigger>
        </TabsList>

        {/* ABA FINANCEIRO */}
        <TabsContent value="financeiro" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Recebido", valor: totalRecebido, cor: "text-green-400" },
              { label: "Total Pago", valor: totalPago, cor: "text-red-400" },
              { label: "A Receber", valor: aReceber, cor: "text-yellow-400" },
              { label: "A Pagar", valor: aPagar, cor: "text-orange-400" },
            ].map((k) => (
              <Card key={k.label} className="border-border/60">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
                  <p className={`text-xl font-bold ${k.cor}`}>{fmt(k.valor)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Receitas vs Despesas — 6 meses</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dadosMensais}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} width={55} />
                    <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "#1e1a17", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Receitas" fill="#4ade80" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Despesas" fill="#f87171" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Por Categoria</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                {porCategoria.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8">Sem dados</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={porCategoria} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                        {porCategoria.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "#1e1a17", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                Despesas por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {despesasPorTipo.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma despesa registrada</p>
              ) : (
                <div className="space-y-2">
                  {despesasPorTipo.map((d) => {
                    const pct = totalPago > 0 ? (d.total / totalPago) * 100 : 0;
                    return (
                      <div key={d.tipo} className="flex items-center gap-3">
                        <span className="text-sm w-28 shrink-0">{d.tipo}</span>
                        <div className="flex-1 bg-muted/30 rounded-full h-2">
                          <div className="bg-red-400/70 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-semibold text-red-400 w-28 text-right shrink-0">{fmt(d.total)}</span>
                        <span className="text-xs text-muted-foreground w-10 text-right shrink-0">{pct.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA PROJETOS */}
        <TabsContent value="projetos" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(statusCount).map(([status, count]) => (
              <Card key={status} className="border-border/60">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{statusLabel[status]}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Projetos por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {projetos.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40">
                    <div>
                      <p className="text-sm font-medium">{p.nome}</p>
                      <p className="text-xs text-muted-foreground">{p.clientes?.nome ?? "Sem cliente"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {p.valor_contrato && <span className="text-sm text-muted-foreground">{fmt(p.valor_contrato)}</span>}
                      <Badge variant="secondary" className="text-xs">{statusLabel[p.status]}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA CLIENTES */}
        <TabsContent value="clientes" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Total de Clientes</p>
                <p className="text-2xl font-bold">{clientes.length}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Clientes Ativos</p>
                <p className="text-2xl font-bold">{clientes.filter((c) => c.ativo).length}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Lista de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {clientes.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40">
                    <div>
                      <p className="text-sm font-medium">{c.nome}</p>
                      <p className="text-xs text-muted-foreground">{c.cidade && c.estado ? `${c.cidade} / ${c.estado}` : c.email ?? "—"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{c.tipo === "pessoa_juridica" ? "PJ" : "PF"}</Badge>
                      <Badge variant={c.ativo ? "default" : "secondary"} className="text-xs">{c.ativo ? "Ativo" : "Inativo"}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Recebidos por Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recebidosPorCliente.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum recebimento com cliente vinculado</p>
              ) : (
                <div className="rounded-lg border border-border/40 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30 text-muted-foreground text-xs">
                        <th className="text-left p-3 font-medium">Cliente</th>
                        <th className="text-center p-3 font-medium">Lançamentos</th>
                        <th className="text-right p-3 font-medium">Total Recebido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recebidosPorCliente.map((r, i) => (
                        <tr key={i} className="border-t border-border/40 hover:bg-muted/20">
                          <td className="p-3 font-medium">{r.cliente}</td>
                          <td className="p-3 text-center text-muted-foreground">{r.lancamentos}</td>
                          <td className="p-3 text-right font-semibold text-green-400">{fmt(r.total)}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-border/60 bg-muted/10">
                        <td className="p-3 font-semibold">Total</td>
                        <td className="p-3 text-center font-semibold">{recebidosPorCliente.reduce((s, r) => s + r.lancamentos, 0)}</td>
                        <td className="p-3 text-right font-semibold text-green-400">{fmt(recebidosPorCliente.reduce((s, r) => s + r.total, 0))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
