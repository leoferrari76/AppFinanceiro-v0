import { supabase } from "@/lib/supabase";

export interface Transaction {
  id: string;
  user_id: string;
  type: "income" | "expense";
  date: string;
  description: string;
  amount: number;
  category: string;
  is_recurring?: boolean;
  recurring_start_date?: string;
  recurring_end_date?: string;
  created_at?: string;
  updated_at?: string;
}

export const createTransaction = async (transaction: Omit<Transaction, "id" | "created_at" | "updated_at">) => {
  console.log('Creating transaction in Supabase:', transaction);
  try {
    if (transaction.type !== 'income' && transaction.type !== 'expense') {
      throw new Error('Invalid transaction type. Must be either "income" or "expense"');
    }

    if (!transaction.user_id || !transaction.date || !transaction.description || !transaction.amount || !transaction.category) {
      throw new Error('Missing required fields');
    }

    const transactionData = {
      ...transaction,
      is_recurring: transaction.is_recurring || false,
      type: transaction.type.toLowerCase() as "income" | "expense",
      amount: Number(transaction.amount)
    };

    console.log('Final transaction data:', transactionData);

    const { data, error } = await supabase
      .from("transactions")
      .insert([transactionData])
      .select()
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }

    console.log('Transaction created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in createTransaction:', error);
    throw error;
  }
};

export const getTransactions = async (userId: string) => {
  console.log('Fetching transactions for user:', userId);
  try {
    if (!userId) {
      console.error('Error: userId is required');
      throw new Error('User ID is required');
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }

    if (!data) {
      console.log('No transactions found for user:', userId);
      return [];
    }

    console.log('Transactions fetched successfully:', data.length);
    return data;
  } catch (error) {
    console.error('Error in getTransactions:', error);
    throw error;
  }
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
  console.log('Updating transaction:', { id, updates });
  try {
    const { data, error } = await supabase
      .from("transactions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }

    console.log('Transaction updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in updateTransaction:', error);
    throw error;
  }
};

export const deleteTransaction = async (id: string) => {
  console.log('Deleting transaction:', id);
  try {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }

    console.log('Transaction deleted successfully');
  } catch (error) {
    console.error('Error in deleteTransaction:', error);
    throw error;
  }
}; 