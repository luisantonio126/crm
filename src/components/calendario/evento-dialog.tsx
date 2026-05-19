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
import { Loader2 } from "lucide-react";
import { criarEvento, atualizarEvento, type EventoFormData } from "@/app/actions/eventos";
import type { Evento, Cliente, Projeto } from "@/types";

const TIPOS = [
  { value: "reuniao", label: "Reunião" },
  { value: "visita", label: "Visita" },
  { value: "prazo", label: "Prazo" },
  { value: "pagamento", label: "Pagamento" },
  { value: "outro", label: "Outro" },
];

interface EventoDialogProps {
  open: boolean;
  onClose: () => void;
  evento?: Evento;
  dataInicial?: string;
  clientes: Cliente[];
  projetos: Projeto[];
}

export function EventoDialog({ open, onClose, evento, dataInicial, clientes, projetos }: EventoDialogProps) {
  const isEditing = !!evento;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<EventoFormData>({
    titulo: evento?.titulo ?? "",
    descricao: evento?.descricao ?? "",
    data_inicio: evento?.data_inicio
      ? evento.data_inicio.slice(0, 16)
      : dataInicial
        ? `${dataInicial}T08:00`
        : "",
    data_fim: evento?.data_fim ? evento.data_fim.slice(0, 16) : "",
    dia_inteiro: evento?.dia_inteiro ?? false,
    tipo: evento?.tipo ?? "reuniao",
    projeto_id: evento?.projeto_id ?? "",
    cliente_id: evento?.cliente_id ?? "",
  });

  function set(field: keyof EventoFormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = isEditing
        ? await atualizarEvento(evento.id, form)
        : await criarEvento(form);
      if (result.error) { setError(result.error); return; }
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Evento" : "Novo Evento"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" value={form.titulo} onChange={(e) => set("titulo", e.target.value)} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => set("tipo", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="data_inicio">Início *</Label>
              <Input
                id="data_inicio"
                type={form.dia_inteiro ? "date" : "datetime-local"}
                value={form.dia_inteiro ? form.data_inicio.slice(0, 10) : form.data_inicio}
                onChange={(e) => set("data_inicio", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="data_fim">Fim</Label>
              <Input
                id="data_fim"
                type={form.dia_inteiro ? "date" : "datetime-local"}
                value={form.dia_inteiro ? form.data_fim?.slice(0, 10) ?? "" : form.data_fim ?? ""}
                onChange={(e) => set("data_fim", e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dia_inteiro"
              checked={form.dia_inteiro}
              onChange={(e) => set("dia_inteiro", e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <Label htmlFor="dia_inteiro" className="cursor-pointer">Dia inteiro</Label>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                  {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Projeto</Label>
              <Select value={form.projeto_id || "_none"} onValueChange={(v) => set("projeto_id", v === "_none" ? "" : v)}>
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
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" value={form.descricao} onChange={(e) => set("descricao", e.target.value)} rows={2} />
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
