"use client";

import { useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { KanbanCard } from "./kanban-card";
import type { Projeto } from "@/types";

interface Coluna {
  id: string;
  label: string;
  color: string;
}

interface KanbanColumnProps {
  coluna: Coluna;
  cards: Projeto[];
  clienteMap: Record<string, string>;
  onNew: () => void;
  onEdit: (projeto: Projeto) => void;
}

export function KanbanColumn({ coluna, cards, clienteMap, onNew, onEdit }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: coluna.id });

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold uppercase tracking-wide ${coluna.color}`}>
            {coluna.label}
          </span>
          <span className="text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 font-medium">
            {cards.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={onNew}
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 flex-1 min-h-24 rounded-xl p-2 transition-colors ${
          isOver ? "bg-primary/5 ring-1 ring-primary/20" : "bg-muted/20"
        }`}
      >
        {cards.map((projeto) => (
          <KanbanCard
            key={projeto.id}
            projeto={projeto}
            clienteMap={clienteMap}
            onEdit={onEdit}
          />
        ))}

        {cards.length === 0 && (
          <div className="flex items-center justify-center h-16 text-xs text-muted-foreground/50">
            Arraste projetos aqui
          </div>
        )}
      </div>
    </div>
  );
}
