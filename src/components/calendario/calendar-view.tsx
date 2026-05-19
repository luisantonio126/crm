"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Calendar } from "lucide-react";
import { EventoDialog } from "./evento-dialog";
import { excluirEvento } from "@/app/actions/eventos";
import type { Evento, Cliente, Projeto, Transacao } from "@/types";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const tipoColor: Record<string, string> = {
  reuniao: "bg-blue-500/80",
  visita: "bg-purple-500/80",
  prazo: "bg-yellow-500/80",
  pagamento: "bg-green-500/80",
  outro: "bg-primary/70",
  vencimento: "bg-red-500/80",
  entrega: "bg-orange-500/80",
};

const tipoLabel: Record<string, string> = {
  reuniao: "Reunião", visita: "Visita", prazo: "Prazo",
  pagamento: "Pagamento", outro: "Outro", vencimento: "Vencimento", entrega: "Entrega",
};

interface CalendarItem {
  id: string;
  titulo: string;
  tipo: string;
  data: string;
  origem: "evento" | "transacao" | "projeto";
  raw?: Evento;
}

interface CalendarViewProps {
  eventos: Evento[];
  transacoes: Transacao[];
  projetos: Projeto[];
  clientes: Cliente[];
}

export function CalendarView({ eventos, transacoes, projetos, clientes }: CalendarViewProps) {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Evento | undefined>();
  const [dataInicial, setDataInicial] = useState("");
  const [, startTransition] = useTransition();

  function prevMes() { if (mes === 0) { setMes(11); setAno(a => a - 1); } else setMes(m => m - 1); }
  function nextMes() { if (mes === 11) { setMes(0); setAno(a => a + 1); } else setMes(m => m + 1); }

  // Monta todos os items do calendário
  const items: CalendarItem[] = [
    ...eventos.map((e) => ({
      id: e.id, titulo: e.titulo, tipo: e.tipo,
      data: e.data_inicio.slice(0, 10), origem: "evento" as const, raw: e,
    })),
    ...transacoes.filter((t) => t.status === "pendente").map((t) => ({
      id: `tx-${t.id}`, titulo: t.descricao,
      tipo: "vencimento", data: t.data_vencimento, origem: "transacao" as const,
    })),
    ...projetos.filter((p) => p.data_previsao).map((p) => ({
      id: `proj-${p.id}`, titulo: `Entrega: ${p.nome}`,
      tipo: "entrega", data: p.data_previsao!, origem: "projeto" as const,
    })),
  ];

  // Grade do mês
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(primeiroDia).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];
  // Preenche até completar a última semana
  while (cells.length % 7 !== 0) cells.push(null);

  function itensDoDia(dia: number): CalendarItem[] {
    const key = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    return items.filter((i) => i.data === key);
  }

  function isHoje(dia: number) {
    return dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();
  }

  function openNew(dia: number) {
    setEditando(undefined);
    setDataInicial(`${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    startTransition(async () => { await excluirEvento(id); });
  }

  // Lista lateral — eventos do mês atual
  const itensMes = items
    .filter((i) => i.data.startsWith(`${ano}-${String(mes + 1).padStart(2, "0")}`))
    .sort((a, b) => a.data.localeCompare(b.data));

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Grade do calendário */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMes}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-base font-semibold w-40 text-center">
                {MESES[mes]} {ano}
              </h2>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMes}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button size="sm" className="gap-2" onClick={() => { setEditando(undefined); setDataInicial(""); setDialogOpen(true); }}>
              <Plus className="w-4 h-4" />
              Novo Evento
            </Button>
          </div>

          {/* Dias da semana */}
          <div className="grid grid-cols-7 mb-1">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Células */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((dia, idx) => {
              if (!dia) return <div key={idx} className="min-h-20 rounded-md" />;
              const dayItems = itensDoDia(dia);
              return (
                <div
                  key={idx}
                  className={`min-h-20 rounded-md border p-1 cursor-pointer group transition-colors ${
                    isHoje(dia)
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/40 hover:border-border hover:bg-muted/20"
                  }`}
                  onClick={() => openNew(dia)}
                >
                  <span className={`text-xs font-medium block mb-1 w-5 h-5 flex items-center justify-center rounded-full ${
                    isHoje(dia) ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}>
                    {dia}
                  </span>
                  <div className="space-y-0.5">
                    {dayItems.slice(0, 3).map((item) => (
                      <Popover key={item.id}>
                        <PopoverTrigger
                          onClick={(e) => e.stopPropagation()}
                          className={`text-[10px] px-1 py-0.5 rounded truncate text-white cursor-pointer w-full text-left border-0 bg-transparent p-0 ${tipoColor[item.tipo]}`}
                        >
                          {item.titulo}
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-3" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium leading-snug">{item.titulo}</p>
                              {item.origem === "evento" && item.raw && (
                                <div className="flex gap-1 shrink-0">
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditando(item.raw); setDialogOpen(true); }}>
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(item.id)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            <Badge variant="outline" className={`text-[10px] text-white border-0 ${tipoColor[item.tipo]}`}>
                              {tipoLabel[item.tipo]}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.data + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ))}
                    {dayItems.length > 3 && (
                      <p className="text-[10px] text-muted-foreground pl-1">+{dayItems.length - 3} mais</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lista lateral */}
        <div className="lg:w-64 shrink-0">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            {MESES[mes]}
          </h3>
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {itensMes.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Nenhum evento este mês</p>
            ) : (
              itensMes.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-2 p-2 rounded-lg border border-border/40 hover:bg-muted/20 transition-colors ${item.origem === "evento" ? "cursor-pointer" : ""}`}
                  onClick={() => {
                    if (item.origem === "evento" && item.raw) {
                      setEditando(item.raw);
                      setDialogOpen(true);
                    }
                  }}
                >
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${tipoColor[item.tipo]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.titulo}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(item.data + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      {" · "}{tipoLabel[item.tipo]}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <EventoDialog
        key={editando?.id ?? "novo"}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        evento={editando}
        dataInicial={dataInicial}
        clientes={clientes}
        projetos={projetos}
      />
    </>
  );
}
