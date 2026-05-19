"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

export type Notificacao = {
  id: string;
  tipo: "vencimento" | "prazo" | "urgente";
  titulo: string;
  descricao: string;
};

interface NotificationsProps {
  notificacoes: Notificacao[];
}

export function Notifications({ notificacoes }: NotificationsProps) {
  const [open, setOpen] = useState(false);

  const urgentes = notificacoes.filter((n) => n.tipo === "urgente").length;
  const total = notificacoes.length;

  const corTipo = {
    urgente: "text-destructive",
    vencimento: "text-yellow-400",
    prazo: "text-blue-400",
  };

  const bgTipo = {
    urgente: "bg-destructive/10",
    vencimento: "bg-yellow-400/10",
    prazo: "bg-blue-400/10",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="w-4 h-4" />
          {total > 0 && (
            <span className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white ${urgentes > 0 ? "bg-destructive" : "bg-primary"}`}>
              {total > 9 ? "9+" : total}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3 border-b border-border">
          <p className="text-sm font-semibold">Notificações</p>
          <p className="text-xs text-muted-foreground">{total} {total === 1 ? "alerta" : "alertas"} pendentes</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {total === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Tudo em dia!</p>
            </div>
          ) : (
            notificacoes.map((n, i) => (
              <div key={n.id}>
                <div className={`flex items-start gap-3 p-3 hover:bg-muted/20 transition-colors ${bgTipo[n.tipo]}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.tipo === "urgente" ? "bg-destructive" : n.tipo === "vencimento" ? "bg-yellow-400" : "bg-blue-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${corTipo[n.tipo]}`}>{n.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.descricao}</p>
                  </div>
                </div>
                {i < notificacoes.length - 1 && <Separator />}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
