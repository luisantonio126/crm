"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, UserCircle2 } from "lucide-react";
import { MembroDialog } from "./membro-dialog";
import { excluirMembro } from "@/app/actions/membros";
import type { Membro } from "@/types";

interface EquipeListProps {
  membros: Membro[];
}

export function EquipeList({ membros }: EquipeListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Membro | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function openNew() { setEditando(undefined); setDialogOpen(true); }
  function openEdit(m: Membro) { setEditando(m); setDialogOpen(true); }

  function handleDelete() {
    if (!deletingId) return;
    startTransition(async () => { await excluirMembro(deletingId); setDeletingId(null); });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {membros.length} {membros.length === 1 ? "membro" : "membros"} cadastrados
        </p>
        <Button size="sm" className="gap-2" onClick={openNew}>
          <Plus className="w-4 h-4" />
          Novo Membro
        </Button>
      </div>

      <div className="rounded-lg border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[90px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {membros.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  Nenhum membro cadastrado ainda.
                </TableCell>
              </TableRow>
            ) : (
              membros.map((m) => (
                <TableRow key={m.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => openEdit(m)}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <UserCircle2 className="w-3.5 h-3.5 text-primary" />
                      </div>
                      {m.nome}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{m.cargo ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{m.email ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{m.telefone ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={m.ativo ? "default" : "secondary"} className="text-xs">
                      {m.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeletingId(m.id)}
                      >
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

      <MembroDialog
        key={editando?.id ?? "novo"}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        membro={editando}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir membro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O membro será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
