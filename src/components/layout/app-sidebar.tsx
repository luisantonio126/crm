"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, KanbanSquare, DollarSign,
  Calendar, Settings, Building2, LogOut,
  MessageSquare, BarChart3, UsersRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navPrincipal = [
  { title: "Dashboard",  url: "/dashboard",  icon: LayoutDashboard },
  { title: "Clientes",   url: "/clientes",   icon: Users },
  { title: "Projetos",   url: "/projetos",   icon: KanbanSquare },
  { title: "Equipe",     url: "/equipe",     icon: UsersRound },
  { title: "Calendário", url: "/calendario", icon: Calendar },
];

const navFinanceiro = [
  { title: "Fluxo de Caixa", url: "/financeiro/fluxo", icon: DollarSign },
];

const navOutros = [
  { title: "Mensagens",  url: "/chat",       icon: MessageSquare },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
];

function NavGroup({ label, items, pathname }: {
  label: string;
  items: { title: string; url: string; icon: React.ElementType }[];
  pathname: string;
}) {
  return (
    <div className="px-3 mb-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-2 mb-1">
        {label}
      </p>
      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = pathname === item.url || pathname.startsWith(item.url + "/");
          return (
            <Link
              key={item.url}
              href={item.url}
              className={cn(
                "flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex flex-col w-52 shrink-0 bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-primary/15 border border-primary/25">
          <Building2 className="w-4 h-4 text-primary" />
        </div>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-sm font-semibold text-sidebar-foreground truncate">Oliveira Nunes</span>
          <span className="text-xs text-muted-foreground">Engenharia</span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-3">
        <NavGroup label="Principal"   items={navPrincipal}  pathname={pathname} />
        <NavGroup label="Financeiro"  items={navFinanceiro} pathname={pathname} />
        <NavGroup label="Outros"      items={navOutros}     pathname={pathname} />
      </div>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-3 flex flex-col gap-0.5">
        <Link
          href="/configuracoes"
          className={cn(
            "flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors",
            pathname === "/configuracoes"
              ? "bg-sidebar-accent text-sidebar-foreground font-medium"
              : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          )}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Configurações</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-2 py-2 rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
