"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { criarProjeto, atualizarProjeto, type ProjetoFormData } from "@/app/actions/projetos";
import type { Projeto, Cliente } from "@/types";

interface ProjetoDialogProps {
  open: boolean;
  onClose: () => void;
  projeto?: Projeto;
  clientes: Cliente[];
  statusInicial?: string;
}

export function ProjetoDialog({ open, onClose, projeto, clientes, statusInicial }: ProjetoDialogProps) {
  const isEditing = !!projeto;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ProjetoFormData>({
    nome: projeto?.nome ?? "",
    descricao: projeto?.descricao ?? "",
    cliente_id: projeto?.cliente_id ?? "",
    status: (projeto?.status ?? statusInicial ?? "backlog") as ProjetoFormData["status"],
    prioridade: projeto?.prioridade ?? "media",
    data_inicio: projeto?.data_inicio ?? "",
    data_previsao: projeto?.data_previsao ?? "",
    valor_contrato: projeto?.valor_contrato ?? null,
  });

  function set(field: keyof ProjetoFormData, value: string | number | null) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = isEditing
        ? await atualizarProjeto(projeto.id, form)
        : await criarProjeto(form);

      if (result.error) { setError(result.error); return; }
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome do Projeto *</Label>
            <Input id="nome" value={form.nome} onChange={(e) => set("nome", e.target.value)} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" value={form.descricao} onChange={(e) => set("descricao", e.target.value)} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="revisao">Revisão</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Prioridade</Label>
              <Select value={form.prioridade} onValueChange={(v) => set("prioridade", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Cliente</Label>
            <Select value={form.cliente_id || "_none"} onValueChange={(v) => set("cliente_id", v === "_none" ? "" : v)}>
              <SelectTrigger>
                <span className="truncate text-sm">
                  {clientes.find((c) => c.id === form.cliente_id)?.nome ?? <span className="text-muted-foreground">Nenhum</span>}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Nenhum</SelectItem>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="data_inicio">Data de Início</Label>
              <Input id="data_inicio" type="date" value={form.data_inicio} onChange={(e) => set("data_inicio", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="data_previsao">Previsão de Entrega</Label>
              <Input id="data_previsao" type="date" value={form.data_previsao} onChange={(e) => set("data_previsao", e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="valor_contrato">Valor do Contrato (R$)</Label>
            <Input
              id="valor_contrato"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={form.valor_contrato ?? ""}
              onChange={(e) => set("valor_contrato", e.target.value ? parseFloat(e.target.value) : null)}
            />
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
