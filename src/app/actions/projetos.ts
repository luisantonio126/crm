"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ProjetoFormData = {
  nome: string;
  descricao?: string;
  cliente_id?: string;
  membro_id?: string;
  status: "novo_lead" | "avaliacao_marcada" | "laudo" | "finalizado";
  prioridade: "baixa" | "media" | "alta";
  data_inicio?: string;
  data_previsao?: string;
  valor_contrato?: number | null;
};

export async function criarProjeto(data: ProjetoFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("projetos").insert({
    ...data,
    cliente_id: data.cliente_id || null,
    membro_id: data.membro_id || null,
    valor_contrato: data.valor_contrato || null,
    created_by: user?.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/projetos");
  return { success: true };
}

export async function atualizarProjeto(id: string, data: Partial<ProjetoFormData>) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projetos")
    .update({ ...data, cliente_id: data.cliente_id || null, membro_id: data.membro_id || null })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/projetos");
  return { success: true };
}

export async function moverProjeto(id: string, novoStatus: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projetos")
    .update({ status: novoStatus })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/projetos");
  return { success: true };
}

export async function excluirProjeto(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("projetos").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/projetos");
  return { success: true };
}
