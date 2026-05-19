"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { criarMembro, atualizarMembro, type MembroFormData } from "@/app/actions/membros";
import type { Membro } from "@/types";

interface MembroDialogProps {
  open: boolean;
  onClose: () => void;
  membro?: Membro;
}

export function MembroDialog({ open, onClose, membro }: MembroDialogProps) {
  const isEditing = !!membro;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<MembroFormData>({
    nome: membro?.nome ?? "",
    email: membro?.email ?? "",
    cargo: membro?.cargo ?? "",
    telefone: membro?.telefone ?? "",
    ativo: membro?.ativo ?? true,
  });

  function set(field: keyof MembroFormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = isEditing
        ? await atualizarMembro(membro.id, form)
        : await criarMembro(form);
      if (result.error) { setError(result.error); return; }
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Membro" : "Novo Membro"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" value={form.nome} onChange={(e) => set("nome", e.target.value)} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cargo">Cargo</Label>
            <Input id="cargo" value={form.cargo} onChange={(e) => set("cargo", e.target.value)} placeholder="Ex: Engenheiro, Técnico..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" value={form.telefone} onChange={(e) => set("telefone", e.target.value)} />
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ativo"
                checked={form.ativo}
                onChange={(e) => set("ativo", e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <Label htmlFor="ativo" className="cursor-pointer">Membro ativo</Label>
            </div>
          )}

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
