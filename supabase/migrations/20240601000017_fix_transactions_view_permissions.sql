-- Primeiro, dropar a view existente se ela existir
DROP MATERIALIZED VIEW IF EXISTS transactions_with_translated_categories;

-- Recriar a view com as permissões corretas
CREATE MATERIALIZED VIEW transactions_with_translated_categories AS
SELECT 
    t.*,
    CASE t.category
        -- Receitas
        WHEN 'salary' THEN 'Salário'
        WHEN 'freelance' THEN 'Freelance'
        WHEN 'investment' THEN 'Investimento'
        WHEN 'gift' THEN 'Presente'
        WHEN 'other' THEN 'Outro'
        
        -- Despesas
        WHEN 'housing' THEN 'Moradia'
        WHEN 'food' THEN 'Alimentação'
        WHEN 'transportation' THEN 'Transporte'
        WHEN 'entertainment' THEN 'Lazer'
        WHEN 'utilities' THEN 'Contas'
        WHEN 'healthcare' THEN 'Saúde'
        WHEN 'recurring' THEN 'Pagamento Recorrente'
        
        -- Se não encontrar tradução, retorna a categoria original
        ELSE t.category
    END as translated_category
FROM transactions t;

-- Criar índice para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_transactions_with_translated_categories_user_id 
ON transactions_with_translated_categories(user_id);

-- Garantir que o trigger de refresh funcione corretamente
DROP TRIGGER IF EXISTS refresh_transactions_view_trigger ON transactions;
CREATE TRIGGER refresh_transactions_view_trigger
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_transactions_view();

-- Conceder permissões necessárias
GRANT SELECT ON transactions_with_translated_categories TO authenticated;
GRANT SELECT ON transactions_with_translated_categories TO service_role;
GRANT SELECT ON transactions_with_translated_categories TO anon;

-- Garantir que o usuário autenticado possa atualizar a view
GRANT TRIGGER ON transactions TO authenticated;
GRANT TRIGGER ON transactions TO service_role; 