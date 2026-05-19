import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { ChatWindow } from "@/components/chat/chat-window";
import { gerarNotificacoes } from "@/lib/notificacoes";

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: transacoes }, { data: projetos }] = await Promise.all([
    supabase.from("transacoes").select("id, descricao, data_vencimento, tipo").eq("status", "pendente"),
    supabase.from("projetos").select("id, nome, data_previsao").not("status", "in", "(concluido,cancelado)"),
  ]);

  const notificacoes = gerarNotificacoes(transacoes ?? [], projetos ?? []);

  return (
    <>
      <Header title="Mensagens" userEmail={user.email} notificacoes={notificacoes} />
      <main className="flex-1 p-4">
        <ChatWindow userId={user.id} userEmail={user.email ?? ""} />
      </main>
    </>
  );
}
