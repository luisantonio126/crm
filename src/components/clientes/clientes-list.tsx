"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, Eye, Building2, User } from "lucide-react";
import { ClienteDialog } from "./cliente-dialog";
import { excluirCliente } from "@/app/actions/clientes";
import type { Cliente } from "@/types";

interface ClientesListProps {
  clientes: Cliente[];
}

export function ClientesList({ clientes }: ClientesListProps) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = clientes.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.cidade?.toLowerCase().includes(search.toLowerCase())
  );

  function openNew() {
    setEditingCliente(undefined);
    setDialogOpen(true);
  }

  function openEdit(cliente: Cliente) {
    setEditingCliente(cliente);
    setDialogOpen(true);
  }

  function handleDelete() {
    if (!deletingId) return;
    startTransition(async () => {
      await excluirCliente(deletingId);
      setDeletingId(null);
    });
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou cidade..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={openNew} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Button>
      </div>

      <div className="rounded-lg border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Telefone</TableHead>
              <TableHead className="hidden lg:table-cell">Cidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  {search ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((cliente) => (
                <TableRow key={cliente.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => openEdit(cliente)}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        {cliente.tipo === "pessoa_juridica"
                          ? <Building2 className="w-3.5 h-3.5 text-primary" />
                          : <User className="w-3.5 h-3.5 text-primary" />
                        }
                      </div>
                      {cliente.nome}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {cliente.tipo === "pessoa_juridica" ? "PJ" : "PF"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {cliente.email ?? "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {cliente.telefone ?? "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                    {cliente.cidade && cliente.estado ? `${cliente.cidade} / ${cliente.estado}` : cliente.cidade ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={cliente.ativo ? "default" : "secondary"} className="text-xs">
                      {cliente.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Link href={`/clientes/${cliente.id}`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-7 w-7")}>
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cliente)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeletingId(cliente.id)}
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

      <p className="text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "cliente" : "clientes"} {search ? "encontrados" : "cadastrados"}
      </p>

      <ClienteDialog
        key={editingCliente?.id ?? "novo"}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        cliente={editingCliente}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cliente será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
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
