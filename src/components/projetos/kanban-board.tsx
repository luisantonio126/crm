"use client";

import { useState, useEffect, useTransition } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { ProjetoDialog } from "./projeto-dialog";
import { moverProjeto } from "@/app/actions/projetos";
import type { Projeto, Cliente, Membro } from "@/types";

export const COLUNAS = [
  { id: "novo_lead",         label: "Novo Lead",          color: "text-muted-foreground" },
  { id: "avaliacao_marcada", label: "Avaliação Marcada",  color: "text-blue-400" },
  { id: "laudo",             label: "Laudo",              color: "text-yellow-400" },
  { id: "finalizado",        label: "Finalizado",         color: "text-green-400" },
] as const;

interface KanbanBoardProps {
  projetos: Projeto[];
  clientes: Cliente[];
  membros: Membro[];
}

export function KanbanBoard({ projetos: initialProjetos, clientes, membros }: KanbanBoardProps) {
  const [projetos, setProjetos] = useState(initialProjetos);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setProjetos(initialProjetos);
  }, [initialProjetos]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProjeto, setEditingProjeto] = useState<Projeto | undefined>();
  const [statusInicial, setStatusInicial] = useState<string>("backlog");
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const activeProject = projetos.find((p) => p.id === activeId);

  function openNew(status: string) {
    setEditingProjeto(undefined);
    setStatusInicial(status);
    setDialogOpen(true);
  }

  function openEdit(projeto: Projeto) {
    setEditingProjeto(projeto);
    setDialogOpen(true);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeProjeto = projetos.find((p) => p.id === activeId);
    if (!activeProjeto) return;

    // Dropped over a column header
    const isOverColumn = COLUNAS.some((c) => c.id === overId);
    if (isOverColumn && activeProjeto.status !== overId) {
      setProjetos((prev) =>
        prev.map((p) => p.id === activeId ? { ...p, status: overId as Projeto["status"] } : p)
      );
      return;
    }

    // Dropped over another card
    const overProjeto = projetos.find((p) => p.id === overId);
    if (overProjeto && activeProjeto.status !== overProjeto.status) {
      setProjetos((prev) =>
        prev.map((p) => p.id === activeId ? { ...p, status: overProjeto.status } : p)
      );
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeProjeto = projetos.find((p) => p.id === activeId);
    if (!activeProjeto) return;

    const novoStatus = activeProjeto.status;

    startTransition(async () => {
      await moverProjeto(activeId, novoStatus);
    });

    // Reorder within same column
    const overProjeto = projetos.find((p) => p.id === overId);
    if (overProjeto && activeId !== overId && activeProjeto.status === overProjeto.status) {
      const colProjetos = projetos.filter((p) => p.status === activeProjeto.status);
      const oldIdx = colProjetos.findIndex((p) => p.id === activeId);
      const newIdx = colProjetos.findIndex((p) => p.id === overId);
      const reordered = arrayMove(colProjetos, oldIdx, newIdx);
      setProjetos((prev) => [
        ...prev.filter((p) => p.status !== activeProjeto.status),
        ...reordered,
      ]);
    }
  }

  const clienteMap = Object.fromEntries(clientes.map((c) => [c.id, c.nome]));

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {projetos.length} {projetos.length === 1 ? "projeto" : "projetos"} no total
        </p>
        <Button size="sm" className="gap-2" onClick={() => openNew("backlog")}>
          <Plus className="w-4 h-4" />
          Novo Projeto
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-200px)]">
          {COLUNAS.map((coluna) => {
            const cards = projetos.filter((p) => p.status === coluna.id);
            return (
              <SortableContext
                key={coluna.id}
                items={cards.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <KanbanColumn
                  coluna={coluna}
                  cards={cards}
                  clienteMap={clienteMap}
                  onNew={() => openNew(coluna.id)}
                  onEdit={openEdit}
                />
              </SortableContext>
            );
          })}
        </div>

        <DragOverlay>
          {activeProject ? (
            <KanbanCard
              projeto={activeProject}
              clienteMap={clienteMap}
              onEdit={openEdit}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <ProjetoDialog
        key={editingProjeto?.id ?? "novo"}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        projeto={editingProjeto}
        clientes={clientes}
        membros={membros}
        statusInicial={statusInicial}
      />
    </>
  );
}
