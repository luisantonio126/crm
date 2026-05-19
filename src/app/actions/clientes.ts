"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ClienteFormData = {
  nome: string;
  email?: string;
  telefone?: string;
  cpf_cnpj?: string;
  tipo: "pessoa_fisica" | "pessoa_juridica";
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
};

export async function criarCliente(data: ClienteFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("clientes").insert({
    ...data,
    created_by: user?.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/clientes");
  return { success: true };
}

export async function atualizarCliente(id: string, data: ClienteFormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clientes")
    .update(data)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { success: true };
}

export async function excluirCliente(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clientes")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/clientes");
  return { success: true };
}

export async function toggleAtivoCliente(id: string, ativo: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clientes")
    .update({ ativo })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/clientes");
  return { success: true };
}
