-- Primeiro, vamos remover a restrição existente
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Agora vamos adicionar a restrição correta
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('income', 'expense'));

-- Vamos verificar se a tabela está vazia e limpar se necessário
TRUNCATE TABLE public.transactions; 