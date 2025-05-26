-- Verifica se a coluna group_id já existe antes de tentar criá-la
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'group_id'
    ) THEN
        -- Adiciona a coluna group_id à tabela transactions
        ALTER TABLE transactions
        ADD COLUMN group_id UUID REFERENCES financial_groups(id);
    END IF;
END $$;

-- Verifica se o índice já existe antes de tentar criá-lo
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'transactions' 
        AND indexname = 'idx_transactions_group_id'
    ) THEN
        -- Adiciona um índice para melhorar a performance das consultas
        CREATE INDEX idx_transactions_group_id ON transactions(group_id);
    END IF;
END $$;

-- Verifica se as políticas já existem antes de tentar criá-las
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'transactions' 
        AND policyname = 'Usuários podem ver transações dos seus grupos'
    ) THEN
        -- Adiciona uma política RLS para permitir acesso às transações do grupo
        ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Usuários podem ver transações dos seus grupos"
        ON transactions
        FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM group_members
                WHERE group_members.group_id = transactions.group_id
                AND group_members.user_id = auth.uid()
            )
            OR transactions.user_id = auth.uid()
        );

        CREATE POLICY "Usuários podem inserir transações nos seus grupos"
        ON transactions
        FOR INSERT
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM group_members
                WHERE group_members.group_id = transactions.group_id
                AND group_members.user_id = auth.uid()
            )
            OR transactions.user_id = auth.uid()
        );

        CREATE POLICY "Usuários podem atualizar transações dos seus grupos"
        ON transactions
        FOR UPDATE
        USING (
            EXISTS (
                SELECT 1 FROM group_members
                WHERE group_members.group_id = transactions.group_id
                AND group_members.user_id = auth.uid()
            )
            OR transactions.user_id = auth.uid()
        );

        CREATE POLICY "Usuários podem deletar transações dos seus grupos"
        ON transactions
        FOR DELETE
        USING (
            EXISTS (
                SELECT 1 FROM group_members
                WHERE group_members.group_id = transactions.group_id
                AND group_members.user_id = auth.uid()
            )
            OR transactions.user_id = auth.uid()
        );
    END IF;
END $$; 