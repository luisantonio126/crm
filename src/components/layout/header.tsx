"use client";

import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Notifications, type Notificacao } from "./notifications";

interface HeaderProps {
  title: string;
  userEmail?: string;
  notificacoes?: Notificacao[];
}

export function Header({ title, userEmail, notificacoes = [] }: HeaderProps) {
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "ON";

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border px-5 shrink-0">
      <span className="text-sm font-semibold text-foreground flex-1">{title}</span>
      <Notifications notificacoes={notificacoes} />
      <Separator orientation="vertical" className="h-4" />
      <Avatar className="h-7 w-7">
        <AvatarFallback className="text-xs bg-primary/15 text-primary border border-primary/20">
          {initials}
        </AvatarFallback>
      </Avatar>
    </header>
  );
}
