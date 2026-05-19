import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Building2, User, Mail, Phone, MapPin, FileText, KanbanSquare, ArrowLeft } from "lucide-react";
import type { Cliente, Projeto } from "@/types";

export default async function ClientePerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();

  if (!cliente) notFound();

  const { data: projetos } = await supabase
    .from("projetos")
    .select("*")
    .eq("cliente_id", id)
    .order("created_at", { ascending: false });

  const { data: { user } } = await supabase.auth.getUser();

  const c = cliente as Cliente;
  const statusLabel: Record<string, string> = {
    backlog: "Backlog",
    em_andamento: "Em Andamento",
    revisao: "Revisão",
    concluido: "Concluído",
    cancelado: "Cancelado",
  };
  const statusColor: Record<string, string> = {
    backlog: "secondary",
    em_andamento: "default",
    revisao: "outline",
    concluido: "default",
    cancelado: "destructive",
  };

  return (
    <>
      <Header title={c.nome} userEmail={user?.email} />
      <main className="flex-1 p-6 space-y-6">
        <Link href="/clientes" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 -ml-2")}>
          <ArrowLeft className="w-4 h-4" />
          Voltar para Clientes
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Dados do cliente */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      {c.tipo === "pessoa_juridica"
                        ? <Building2 className="w-5 h-5 text-primary" />
                        : <User className="w-5 h-5 text-primary" />
                      }
                    </div>
                    <div>
                      <CardTitle className="text-base">{c.nome}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {c.tipo === "pessoa_juridica" ? "Pessoa Jurídica" : "Pessoa Física"}
                        {c.cpf_cnpj && ` • ${c.cpf_cnpj}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant={c.ativo ? "default" : "secondary"}>
                    {c.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {c.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{c.email}</span>
                  </div>
                )}
                {c.telefone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{c.telefone}</span>
                  </div>
                )}
                {(c.cidade || c.endereco) && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>
                      {[c.endereco, c.cidade, c.estado, c.cep].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
                {c.observacoes && (
                  <div className="flex items-start gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{c.observacoes}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resumo */}
          <div className="space-y-4">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <KanbanSquare className="w-4 h-4 text-primary" />
                  Projetos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{projetos?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">projetos vinculados</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Projetos */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Projetos do Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            {!projetos || projetos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum projeto vinculado a este cliente.
              </p>
            ) : (
              <div className="space-y-2">
                {(projetos as Projeto[]).map((projeto) => (
                  <div key={projeto.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{projeto.nome}</p>
                      {projeto.data_previsao && (
                        <p className="text-xs text-muted-foreground">
                          Previsão: {new Date(projeto.data_previsao).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {projeto.valor_contrato && (
                        <span className="text-sm text-muted-foreground">
                          {projeto.valor_contrato.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      )}
                      <Badge variant={statusColor[projeto.status] as "default" | "secondary" | "outline" | "destructive"}>
                        {statusLabel[projeto.status]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
