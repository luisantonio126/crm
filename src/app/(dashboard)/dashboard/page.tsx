import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  KanbanSquare,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";

const kpis = [
  {
    title: "Clientes Ativos",
    value: "—",
    description: "Total de clientes cadastrados",
    icon: Users,
    trend: null,
  },
  {
    title: "Projetos em Andamento",
    value: "—",
    description: "Projetos com status ativo",
    icon: KanbanSquare,
    trend: null,
  },
  {
    title: "Receita do Mês",
    value: "R$ —",
    description: "Entradas confirmadas",
    icon: TrendingUp,
    trend: "up",
  },
  {
    title: "Contas a Vencer",
    value: "—",
    description: "Próximos 7 dias",
    icon: AlertCircle,
    trend: "warn",
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Header title="Dashboard" userEmail={user?.email} />

      <main className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.title} className="border-border/60">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <div className={`p-1.5 rounded-md ${
                  kpi.trend === "warn"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
                }`}>
                  <kpi.icon className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Fluxo de Caixa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                Gráfico disponível após conectar o banco de dados
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <KanbanSquare className="w-4 h-4 text-primary" />
                Projetos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                Nenhum projeto cadastrado
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
