-- Remover o índice único que está causando problemas
DROP INDEX IF EXISTS idx_unique_transaction;

-- Criar um índice mais flexível que permite transações similares
CREATE INDEX IF NOT EXISTS idx_transactions_group_user ON transactions (
  group_id,
  user_id,
  type,
  date
);

-- Adicionar uma restrição de verificação para garantir valores válidos
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_amount_check;

ALTER TABLE transactions
ADD CONSTRAINT transactions_amount_check
CHECK (amount > 0);

-- Garantir que as datas são válidas
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_date_check;

ALTER TABLE transactions
ADD CONSTRAINT transactions_date_check
CHECK (date <= CURRENT_DATE); 