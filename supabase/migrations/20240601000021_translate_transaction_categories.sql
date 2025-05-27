-- Traduzir categorias de transações
CREATE OR REPLACE FUNCTION translate_transaction_category(category text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN CASE category
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
        ELSE category
    END;
END;
$$;

-- Criar view materializada para transações com categorias traduzidas
DROP MATERIALIZED VIEW IF EXISTS transactions_with_translated_categories;
CREATE MATERIALIZED VIEW transactions_with_translated_categories AS
SELECT 
    t.*,
    translate_transaction_category(t.category) as translated_category
FROM transactions t;

-- Criar índice para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_transactions_with_translated_categories_user_id 
ON transactions_with_translated_categories(user_id);

-- Atualizar políticas para usar a view
DROP POLICY IF EXISTS "Usuários podem ver transações dos seus grupos" ON public.transactions;
CREATE POLICY "Usuários podem ver transações dos seus grupos"
ON public.transactions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM group_members
        WHERE group_members.group_id = transactions.group_id
        AND group_members.user_id = auth.uid()
    )
    OR transactions.user_id = auth.uid()
);

-- Criar função para atualizar a view quando houver mudanças nas transações
CREATE OR REPLACE FUNCTION refresh_transactions_view()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW transactions_with_translated_categories;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar a view
DROP TRIGGER IF EXISTS refresh_transactions_view_trigger ON transactions;
CREATE TRIGGER refresh_transactions_view_trigger
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_transactions_view(); 