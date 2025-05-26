-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  group_id UUID REFERENCES public.financial_groups(id),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurring_start_date DATE,
  recurring_end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own transactions"
  ON public.transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view group transactions"
  ON public.transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = transactions.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert group transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = transactions.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own transactions"
  ON public.transactions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update group transactions"
  ON public.transactions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = transactions.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own transactions"
  ON public.transactions
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete group transactions"
  ON public.transactions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = transactions.group_id
      AND gm.user_id = auth.uid()
    )
  );

-- Set up realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Primeiro, vamos desabilitar temporariamente o RLS para limpar os dados
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Limpar as tabelas
TRUNCATE TABLE public.transactions;
TRUNCATE TABLE public.profiles;

-- Reabilitar o RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY; 