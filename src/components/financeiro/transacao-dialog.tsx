"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { criarTransacao, atualizarTransacao, type TransacaoFormData } from "@/app/actions/transacoes";
import type { Transacao, Cliente, Projeto, Membro } from "@/types";

const CATEGORIAS_RECEITA = ["Vistoria", "Avaliação", "Outros"];
const TIPOS_DESPESA = ["Imposto", "ART", "Marketing", "Contador", "Anuidade", "Outros"];

interface TransacaoDialogProps {
  open: boolean;
  onClose: () => void;
  transacao?: Transacao;
  tipoInicial?: "receita" | "despesa";
  clientes: Cliente[];
  projetos: Projeto[];
  membros: Membro[];
}

export function TransacaoDialog({ open, onClose, transacao, tipoInicial = "receita", clientes, projetos, membros }: TransacaoDialogProps) {
  const isEditing = !!transacao;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<TransacaoFormData>({
    tipo: transacao?.tipo ?? tipoInicial,
    descricao: transacao?.descricao ?? "",
    valor: transacao?.valor ?? 0,
    data_vencimento: transacao?.data_vencimento ?? "",
    data_pagamento: transacao?.data_pagamento ?? "",
    status: transacao?.status ?? "pendente",
    categoria: transacao?.categoria ?? "",
    projeto_id: transacao?.projeto_id ?? "",
    cliente_id: transacao?.cliente_id ?? "",
    membro_id: transacao?.membro_id ?? "",
    observacoes: transacao?.observacoes ?? "",
  });

  function set(field: keyof TransacaoFormData, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const categorias = form.tipo === "receita" ? CATEGORIAS_RECEITA : TIPOS_DESPESA;
  const categoriaLabel = form.tipo === "receita" ? "Categoria" : "Tipo";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = isEditing
        ? await atualizarTransacao(transacao.id, form)
        : await criarTransacao(form);
      if (result.error) { setError(result.error); return; }
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Lançamento" : "Novo Lançamento"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {!isEditing && (
            <Tabs value={form.tipo} onValueChange={(v) => { if (v) set("tipo", v); }}>
              <TabsList className="w-full">
                <TabsTrigger value="receita" className="flex-1 data-[state=active]:text-green-400">Receita</TabsTrigger>
                <TabsTrigger value="despesa" className="flex-1 data-[state=active]:text-red-400">Despesa</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input id="descricao" value={form.descricao} onChange={(e) => set("descricao", e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor" type="number" step="0.01" min="0"
                value={form.valor || ""}
                onChange={(e) => set("valor", parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{categoriaLabel}</Label>
              <Select value={form.categoria || "_none"} onValueChange={(v) => set("categoria", (!v || v === "_none") ? "" : v)}>
                <SelectTrigger>
                  <span className="truncate text-sm">
                    {form.categoria || <span className="text-muted-foreground">Nenhum</span>}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum</SelectItem>
                  {categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
              <Input id="data_vencimento" type="date" value={form.data_vencimento} onChange={(e) => set("data_vencimento", e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="data_pagamento">Data de Pagamento</Label>
              <Input id="data_pagamento" type="date" value={form.data_pagamento} onChange={(e) => set("data_pagamento", e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => { if (v) set("status", v); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago / Recebido</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Cliente</Label>
              <Select value={form.cliente_id || "_none"} onValueChange={(v) => set("cliente_id", (!v || v === "_none") ? "" : v)}>
                <SelectTrigger>
                  <span className="truncate text-sm">
                    {clientes.find((c) => c.id === form.cliente_id)?.nome ?? <span className="text-muted-foreground">Nenhum</span>}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum</SelectItem>
                  {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Projeto</Label>
              <Select value={form.projeto_id || "_none"} onValueChange={(v) => set("projeto_id", (!v || v === "_none") ? "" : v)}>
                <SelectTrigger>
                  <span className="truncate text-sm">
                    {projetos.find((p) => p.id === form.projeto_id)?.nome ?? <span className="text-muted-foreground">Nenhum</span>}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum</SelectItem>
                  {projetos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Responsável</Label>
            <Select value={form.membro_id || "_none"} onValueChange={(v) => set("membro_id", (!v || v === "_none") ? "" : v)}>
              <SelectTrigger>
                <span className="truncate text-sm">
                  {membros.find((m) => m.id === form.membro_id)?.nome ?? <span className="text-muted-foreground">Nenhum</span>}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Nenhum</SelectItem>
                {membros.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} rows={2} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
