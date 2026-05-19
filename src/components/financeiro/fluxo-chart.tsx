"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface FluxoChartProps {
  dados: { mes: string; receitas: number; despesas: number; saldo: number }[];
}

const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function FluxoChart({ dados }: FluxoChartProps) {
  if (dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-sm text-muted-foreground">
        Sem dados para exibir
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={dados} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="receitaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4ade80" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="despesaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f87171" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} width={55} />
        <Tooltip
          formatter={(value, name) => [
            formatBRL(Number(value)),
            name === "receitas" ? "Receitas" : name === "despesas" ? "Despesas" : "Saldo",
          ]}
          contentStyle={{ background: "#1e1a17", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#ccc" }}
        />
        <Legend formatter={(v) => v === "receitas" ? "Receitas" : v === "despesas" ? "Despesas" : "Saldo"} wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="receitas" stroke="#4ade80" strokeWidth={2} fill="url(#receitaGrad)" />
        <Area type="monotone" dataKey="despesas" stroke="#f87171" strokeWidth={2} fill="url(#despesaGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
