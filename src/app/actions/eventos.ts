"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type EventoFormData = {
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim?: string;
  dia_inteiro?: boolean;
  tipo: "reuniao" | "visita" | "prazo" | "pagamento" | "outro";
  projeto_id?: string;
  cliente_id?: string;
};

export async function criarEvento(data: EventoFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("eventos").insert({
    ...data,
    projeto_id: data.projeto_id || null,
    cliente_id: data.cliente_id || null,
    data_fim: data.data_fim || null,
    created_by: user?.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/calendario");
  return { success: true };
}

export async function atualizarEvento(id: string, data: Partial<EventoFormData>) {
  const supabase = await createClient();

  const { error } = await supabase.from("eventos").update({
    ...data,
    projeto_id: data.projeto_id || null,
    cliente_id: data.cliente_id || null,
  }).eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/calendario");
  return { success: true };
}

export async function excluirEvento(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("eventos").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/calendario");
  return { success: true };
}
