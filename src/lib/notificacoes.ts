import type { Notificacao } from "@/components/layout/notifications";

type Transacao = { id: string; descricao: string; data_vencimento: string; tipo: string };
type Projeto = { id: string; nome: string; data_previsao: string | null };

export function gerarNotificacoes(
  transacoes: Transacao[],
  projetos: Projeto[]
): Notificacao[] {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const em3dias = new Date(hoje); em3dias.setDate(hoje.getDate() + 3);
  const em7dias = new Date(hoje); em7dias.setDate(hoje.getDate() + 7);

  const notifs: Notificacao[] = [];

  transacoes.forEach((t) => {
    const venc = new Date(t.data_vencimento + "T00:00:00");
    if (venc < hoje) {
      notifs.push({
        id: `venc-${t.id}`,
        tipo: "urgente",
        titulo: `${t.tipo === "receita" ? "Recebimento" : "Pagamento"} vencido`,
        descricao: `${t.descricao} — venceu em ${venc.toLocaleDateString("pt-BR")}`,
      });
    } else if (venc <= em3dias) {
      notifs.push({
        id: `venc-${t.id}`,
        tipo: "urgente",
        titulo: `${t.tipo === "receita" ? "Recebimento" : "Pagamento"} em 3 dias`,
        descricao: `${t.descricao} — vence em ${venc.toLocaleDateString("pt-BR")}`,
      });
    } else if (venc <= em7dias) {
      notifs.push({
        id: `venc-${t.id}`,
        tipo: "vencimento",
        titulo: `${t.tipo === "receita" ? "Recebimento" : "Pagamento"} próximo`,
        descricao: `${t.descricao} — vence em ${venc.toLocaleDateString("pt-BR")}`,
      });
    }
  });

  projetos.forEach((p) => {
    if (!p.data_previsao) return;
    const prazo = new Date(p.data_previsao + "T00:00:00");
    if (prazo < hoje) {
      notifs.push({
        id: `proj-${p.id}`,
        tipo: "urgente",
        titulo: "Prazo de projeto vencido",
        descricao: `${p.nome} — previsão era ${prazo.toLocaleDateString("pt-BR")}`,
      });
    } else if (prazo <= em7dias) {
      notifs.push({
        id: `proj-${p.id}`,
        tipo: "prazo",
        titulo: "Prazo de projeto próximo",
        descricao: `${p.nome} — entrega em ${prazo.toLocaleDateString("pt-BR")}`,
      });
    }
  });

  // Urgentes primeiro
  return notifs.sort((a, b) => (a.tipo === "urgente" ? -1 : b.tipo === "urgente" ? 1 : 0));
}
