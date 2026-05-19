"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type TransacaoFormData = {
  tipo: "receita" | "despesa";
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: "pendente" | "pago" | "cancelado";
  categoria?: string;
  projeto_id?: string;
  cliente_id?: string;
  membro_id?: string;
  observacoes?: string;
  recorrente?: boolean;
};

export async function criarTransacao(data: TransacaoFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("transacoes").insert({
    ...data,
    projeto_id: data.projeto_id || null,
    cliente_id: data.cliente_id || null,
    membro_id: data.membro_id || null,
    data_pagamento: data.data_pagamento || null,
    created_by: user?.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/financeiro/fluxo");
  revalidatePath("/financeiro/receber");
  revalidatePath("/financeiro/pagar");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function atualizarTransacao(id: string, data: Partial<TransacaoFormData>) {
  const supabase = await createClient();

  const { error } = await supabase.from("transacoes").update({
    ...data,
    projeto_id: data.projeto_id || null,
    cliente_id: data.cliente_id || null,
    membro_id: data.membro_id || null,
    data_pagamento: data.data_pagamento || null,
  }).eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/financeiro/fluxo");
  revalidatePath("/financeiro/receber");
  revalidatePath("/financeiro/pagar");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function marcarComoPago(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("transacoes").update({
    status: "pago",
    data_pagamento: new Date().toISOString().split("T")[0],
  }).eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/financeiro/fluxo");
  revalidatePath("/financeiro/receber");
  revalidatePath("/financeiro/pagar");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function excluirTransacao(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("transacoes").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/financeiro/fluxo");
  revalidatePath("/financeiro/receber");
  revalidatePath("/financeiro/pagar");
  revalidatePath("/dashboard");
  return { success: true };
}
