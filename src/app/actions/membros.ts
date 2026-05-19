"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type MembroFormData = {
  nome: string;
  email?: string;
  cargo?: string;
  telefone?: string;
  ativo?: boolean;
};

export async function criarMembro(data: MembroFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("membros").insert({
    ...data,
    user_id: user?.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/equipe");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function atualizarMembro(id: string, data: Partial<MembroFormData>) {
  const supabase = await createClient();

  const { error } = await supabase.from("membros").update(data).eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/equipe");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function excluirMembro(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("membros").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/equipe");
  revalidatePath("/dashboard");
  return { success: true };
}
