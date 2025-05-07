import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, User, LogOut } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { logout } from "../services/auth";
import { useAuth } from "@/contexts/AuthContext";
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from "@/services/transactions";
import MetricsOverview from "./MetricsOverview";
import TransactionForm from "./TransactionForm";
import TransactionList from "./TransactionList";
import { toast } from "@/components/ui/use-toast";

interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  is_recurring?: boolean;
  recurring_start_date?: Date;
  recurring_end_date?: Date;
}

const Home = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar transações quando o componente montar
  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      console.log('Loading transactions for user:', user.id);
      const data = await getTransactions(user.id);
      console.log('Transactions loaded:', data);
      
      const formattedTransactions = data.map(transaction => ({
        ...transaction,
        date: new Date(transaction.date),
        recurring_start_date: transaction.recurring_start_date ? new Date(transaction.recurring_start_date) : undefined,
        recurring_end_date: transaction.recurring_end_date ? new Date(transaction.recurring_end_date) : undefined,
      }));
      
      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as transações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate metrics for the current month
  const currentMonthTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);
    return (
      transactionDate.getMonth() === new Date().getMonth() &&
      transactionDate.getFullYear() === new Date().getFullYear()
    );
  });

  const totalIncome = currentMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpenses = currentMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const currentBalance = totalIncome - totalExpenses;

  // Handle month navigation
  const goToPreviousMonth = () => {
    const prevMonth = new Date(new Date());
    prevMonth.setMonth(prevMonth.getMonth() - 1);
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(new Date());
    nextMonth.setMonth(nextMonth.getMonth() + 1);
  };

  // Handle adding new transactions
  const handleAddTransaction = async (newTransaction: Omit<Transaction, "id">) => {
    if (!user) return;

    try {
      console.log('Adding new transaction:', newTransaction);
      const transaction = await createTransaction({
        ...newTransaction,
        user_id: user.id,
        date: newTransaction.date.toISOString().split('T')[0],
        is_recurring: newTransaction.is_recurring || false,
        recurring_start_date: newTransaction.recurring_start_date?.toISOString().split('T')[0],
        recurring_end_date: newTransaction.recurring_end_date?.toISOString().split('T')[0],
      });
      
      console.log('Transaction created:', transaction);
      
      // Atualizar a lista de transações imediatamente
      const formattedTransaction = {
        ...transaction,
        date: new Date(transaction.date),
        recurring_start_date: transaction.recurring_start_date ? new Date(transaction.recurring_start_date) : undefined,
        recurring_end_date: transaction.recurring_end_date ? new Date(transaction.recurring_end_date) : undefined,
      };
      
      setTransactions(prevTransactions => [formattedTransaction, ...prevTransactions]);

      toast({
        title: "Sucesso",
        description: "Transação adicionada com sucesso.",
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a transação.",
        variant: "destructive",
      });
    }
  };

  // Handle editing transactions
  const handleEditTransaction = async (updatedTransaction: Transaction) => {
    try {
      const transaction = await updateTransaction(updatedTransaction.id, {
        ...updatedTransaction,
        date: updatedTransaction.date.toISOString().split('T')[0],
        recurring_start_date: updatedTransaction.recurring_start_date?.toISOString().split('T')[0],
        recurring_end_date: updatedTransaction.recurring_end_date?.toISOString().split('T')[0],
      });

      // Atualizar a lista de transações imediatamente
      setTransactions(prevTransactions =>
        prevTransactions.map((t) =>
          t.id === updatedTransaction.id
            ? {
                ...transaction,
                date: new Date(transaction.date),
                recurring_start_date: transaction.recurring_start_date ? new Date(transaction.recurring_start_date) : undefined,
                recurring_end_date: transaction.recurring_end_date ? new Date(transaction.recurring_end_date) : undefined,
              }
            : t
        )
      );

      toast({
        title: "Sucesso",
        description: "Transação atualizada com sucesso.",
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a transação.",
        variant: "destructive",
      });
    }
  };

  // Handle deleting transactions
  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      
      // Atualizar a lista de transações imediatamente
      setTransactions(prevTransactions => prevTransactions.filter(t => t.id !== id));
      
      toast({
        title: "Sucesso",
        description: "Transação excluída com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a transação.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-background min-h-screen">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Financial Dashboard</h1>
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => logout()}
                className="flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-medium">
            {format(new Date(), "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <MetricsOverview
            income={totalIncome}
            expenses={totalExpenses}
            balance={currentBalance}
          />
        </CardContent>
      </Card>

      {/* Transaction Form */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Add New Transaction</h2>
        <Card>
          <CardContent className="p-6">
            <TransactionForm onSubmit={handleAddTransaction} />
          </CardContent>
        </Card>
      </div>

      {/* Transaction List */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Transactions</h2>
        <Card>
          <CardContent className="p-6">
            <TransactionList
              transactions={currentMonthTransactions}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;
