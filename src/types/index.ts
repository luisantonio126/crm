export type Cliente = {
  id: string;
  created_at: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cpf_cnpj: string | null;
  tipo: "pessoa_fisica" | "pessoa_juridica";
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  observacoes: string | null;
  ativo: boolean;
  created_by: string | null;
};

export type Projeto = {
  id: string;
  created_at: string;
  nome: string;
  descricao: string | null;
  cliente_id: string | null;
  status: "backlog" | "em_andamento" | "revisao" | "concluido" | "cancelado";
  prioridade: "baixa" | "media" | "alta";
  data_inicio: string | null;
  data_previsao: string | null;
  data_conclusao: string | null;
  valor_contrato: number | null;
  created_by: string | null;
};

export type Tarefa = {
  id: string;
  created_at: string;
  projeto_id: string | null;
  titulo: string;
  descricao: string | null;
  status: "backlog" | "em_andamento" | "revisao" | "concluido";
  prioridade: "baixa" | "media" | "alta";
  responsavel_id: string | null;
  data_vencimento: string | null;
  ordem: number;
  created_by: string | null;
};

export type Transacao = {
  id: string;
  created_at: string;
  tipo: "receita" | "despesa";
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: "pendente" | "pago" | "cancelado";
  categoria: string | null;
  projeto_id: string | null;
  cliente_id: string | null;
  observacoes: string | null;
  recorrente: boolean;
  created_by: string | null;
};

export type Evento = {
  id: string;
  created_at: string;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  dia_inteiro: boolean;
  tipo: "reuniao" | "visita" | "prazo" | "pagamento" | "outro";
  projeto_id: string | null;
  cliente_id: string | null;
  created_by: string | null;
};
