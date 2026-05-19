"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, CheckCircle2, TrendingUp, TrendingDown } from "lucide-react";
import { TransacaoDialog } from "./transacao-dialog";
import { excluirTransacao, marcarComoPago } from "@/app/actions/transacoes";
import type { Transacao, Cliente, Projeto } from "@/types";

interface TransacoesListProps {
  transacoes: Transacao[];
  clientes: Cliente[];
  projetos: Projeto[];
  tipoFiltro?: "receita" | "despesa";
  titulo: string;
}

const statusBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  pago: { label: "Pago", variant: "default" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

export function TransacoesList({ transacoes, clientes, projetos, tipoFiltro, titulo }: TransacoesListProps) {
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Transacao | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const clienteMap = Object.fromEntries(clientes.map((c) => [c.id, c.nome]));
  const projetoMap = Object.fromEntries(projetos.map((p) => [p.id, p.nome]));

  const filtered = transacoes.filter((t) => {
    const matchSearch = t.descricao.toLowerCase().includes(search.toLowerCase()) ||
      t.categoria?.toLowerCase().includes(search.toLowerCase()) ||
      (t.cliente_id && clienteMap[t.cliente_id]?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filtroStatus === "todos" || t.status === filtroStatus;
    return matchSearch && matchStatus;
  });

  const totalPendente = filtered.filter((t) => t.status === "pendente").reduce((s, t) => s + t.valor, 0);
  const totalPago = filtered.filter((t) => t.status === "pago").reduce((s, t) => s + t.valor, 0);

  function openNew() { setEditando(undefined); setDialogOpen(true); }
  function openEdit(t: Transacao) { setEditando(t); setDialogOpen(true); }

  function handleDelete() {
    if (!deletingId) return;
    startTransition(async () => { await excluirTransacao(deletingId); setDeletingId(null); });
  }

  function handlePago(id: string) {
    startTransition(async () => { await marcarComoPago(id); });
  }

  const isVencida = (t: Transacao) =>
    t.status === "pendente" && new Date(t.data_vencimento) < new Date();

  return (
    <>
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            {tipoFiltro === "receita"
              ? <TrendingUp className="w-4 h-4 text-green-400" />
              : <TrendingDown className="w-4 h-4 text-red-400" />
            }
            <span className="text-xs text-muted-foreground">Pendente</span>
          </div>
          <p className="text-xl font-bold">
            {totalPendente.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">
              {tipoFiltro === "receita" ? "Recebido" : "Pago"}
            </span>
          </div>
          <p className="text-xl font-bold">
            {totalPago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="pago">Pagos</SelectItem>
            <SelectItem value="cancelado">Cancelados</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" className="gap-2" onClick={openNew}>
          <Plus className="w-4 h-4" />
          {tipoFiltro === "receita" ? "Nova Receita" : "Nova Despesa"}
        </Button>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="hidden md:table-cell">Vencimento</TableHead>
              <TableHead className="hidden lg:table-cell">Cliente / Projeto</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[110px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Nenhum lançamento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow
                  key={t.id}
                  className={`cursor-pointer hover:bg-muted/30 ${isVencida(t) ? "bg-destructive/5" : ""}`}
                  onClick={() => openEdit(t)}
                >
                  <TableCell className="font-medium text-sm">
                    {t.descricao}
                    {isVencida(t) && <span className="ml-2 text-[10px] text-destructive font-semibold">VENCIDA</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{t.categoria ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {new Date(t.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {t.cliente_id && clienteMap[t.cliente_id]
                      ? clienteMap[t.cliente_id]
                      : t.projeto_id && projetoMap[t.projeto_id]
                        ? projetoMap[t.projeto_id]
                        : "—"}
                  </TableCell>
                  <TableCell className={`font-semibold text-sm ${t.tipo === "receita" ? "text-green-400" : "text-red-400"}`}>
                    {t.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadge[t.status].variant} className="text-xs">
                      {statusBadge[t.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {t.status === "pendente" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-green-400" title="Marcar como pago" onClick={() => handlePago(t.id)}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeletingId(t.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{filtered.length} lançamentos</p>

      <TransacaoDialog
        key={editando?.id ?? "novo"}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        transacao={editando}
        tipoInicial={tipoFiltro}
        clientes={clientes}
        projetos={projetos}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
