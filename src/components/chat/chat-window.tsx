"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2 } from "lucide-react";

type Mensagem = {
  id: string;
  created_at: string;
  conteudo: string;
  autor_id: string;
  autor_nome: string | null;
};

interface ChatWindowProps {
  userId: string;
  userEmail: string;
}

export function ChatWindow({ userId, userEmail }: ChatWindowProps) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    // Carrega histórico
    supabase
      .from("mensagens")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data) setMensagens(data as Mensagem[]);
        setLoading(false);
      });

    // Escuta novas mensagens em tempo real
    const channel = supabase
      .channel("mensagens-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagens" },
        (payload) => {
          setMensagens((prev) => [...prev, payload.new as Mensagem]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    const conteudo = texto.trim();
    setTexto("");

    startTransition(async () => {
      await supabase.from("mensagens").insert({
        conteudo,
        autor_id: userId,
        autor_nome: userEmail.split("@")[0],
      });
    });
  }

  const formatHora = (iso: string) =>
    new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const formatData = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  let lastData = "";

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-2xl mx-auto">
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : mensagens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <p className="text-sm">Nenhuma mensagem ainda.</p>
            <p className="text-xs mt-1">Comece a conversa!</p>
          </div>
        ) : (
          mensagens.map((m) => {
            const isMeu = m.autor_id === userId;
            const dataStr = formatData(m.created_at);
            const mostrarData = dataStr !== lastData;
            lastData = dataStr;

            return (
              <div key={m.id}>
                {mostrarData && (
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] text-muted-foreground px-2">{dataStr}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}
                <div className={`flex items-end gap-2 ${isMeu ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-[10px] bg-primary/15 text-primary border border-primary/20">
                      {(m.autor_nome ?? "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[70%] ${isMeu ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                    {!isMeu && (
                      <span className="text-[10px] text-muted-foreground ml-1">{m.autor_nome}</span>
                    )}
                    <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      isMeu
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}>
                      {m.conteudo}
                    </div>
                    <span className="text-[10px] text-muted-foreground mx-1">{formatHora(m.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="flex-1"
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={isPending || !texto.trim()}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
