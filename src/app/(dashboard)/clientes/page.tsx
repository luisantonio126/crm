import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { ClientesList } from "@/components/clientes/clientes-list";
import type { Cliente } from "@/types";

export default async function ClientesPage() {
  const supabase = await createClient();

  const { data: clientes } = await supabase
    .from("clientes")
    .select("*")
    .order("nome");

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Header title="Clientes" userEmail={user?.email} />
      <main className="flex-1 p-6 space-y-4">
        <ClientesList clientes={(clientes as Cliente[]) ?? []} />
      </main>
    </>
  );
}
