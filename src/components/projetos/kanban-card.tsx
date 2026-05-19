"use client";

import { useTransition } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, GripVertical, Calendar, User, DollarSign } from "lucide-react";
import { excluirProjeto } from "@/app/actions/projetos";
import type { Projeto } from "@/types";

const prioridadeColor = {
  alta: "text-red-400 bg-red-400/10 border-red-400/20",
  media: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  baixa: "text-green-400 bg-green-400/10 border-green-400/20",
};

interface KanbanCardProps {
  projeto: Projeto;
  clienteMap: Record<string, string>;
  onEdit: (projeto: Projeto) => void;
  isDragging?: boolean;
}

export function KanbanCard({ projeto, clienteMap, onEdit, isDragging }: KanbanCardProps) {
  const [, startTransition] = useTransition();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: projeto.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Excluir o projeto "${projeto.nome}"?`)) return;
    startTransition(async () => {
      await excluirProjeto(projeto.id);
    });
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      onClick={() => !isDragging && onEdit(projeto)}
      className={`border-border/50 cursor-pointer group hover:border-primary/30 transition-colors ${
        isDragging ? "shadow-lg ring-1 ring-primary/30 cursor-grabbing" : ""
      }`}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start gap-1.5">
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug line-clamp-2">{projeto.nome}</p>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              variant="ghost" size="icon"
              className="h-5 w-5"
              onClick={(e) => { e.stopPropagation(); onEdit(projeto); }}
            >
              <Pencil className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 items-center">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border ${prioridadeColor[projeto.prioridade]}`}>
            {projeto.prioridade}
          </Badge>

          {projeto.cliente_id && clienteMap[projeto.cliente_id] && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <User className="w-3 h-3" />
              {clienteMap[projeto.cliente_id]}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          {projeto.data_previsao && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(projeto.data_previsao + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </span>
          )}
          {projeto.valor_contrato && (
            <span className="flex items-center gap-1 ml-auto">
              <DollarSign className="w-3 h-3" />
              {projeto.valor_contrato.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
