import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, User, LogOut } from "lucide-react";
import { format, subMonths, addMonths, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
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
import FinancialInsights from "./FinancialInsights";
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
  const [selectedDate, setSelectedDate] = useState(new Date());

  const isCurrentMonth = isSameMonth(selectedDate, new Date());

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

  // Calculate metrics for the selected month
  const selectedMonthTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);
    return (
      transactionDate.getMonth() === selectedDate.getMonth() &&
      transactionDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  // Calculate metrics for the previous month
  const previousMonthDate = subMonths(selectedDate, 1);
  const previousMonthTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);
    return (
      transactionDate.getMonth() === previousMonthDate.getMonth() &&
      transactionDate.getFullYear() === previousMonthDate.getFullYear()
    );
  });

  const selectedMonthIncome = selectedMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const selectedMonthExpenses = selectedMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const selectedMonthBalance = selectedMonthIncome - selectedMonthExpenses;

  const previousMonthIncome = previousMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const previousMonthExpenses = previousMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const previousMonthBalance = previousMonthIncome - previousMonthExpenses;

  // Calculate variations
  const incomeVariation = previousMonthIncome === 0 ? 0 : ((selectedMonthIncome - previousMonthIncome) / previousMonthIncome) * 100;
  const expensesVariation = previousMonthExpenses === 0 ? 0 : ((selectedMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100;
  const balanceVariation = previousMonthBalance === 0 ? 0 : ((selectedMonthBalance - previousMonthBalance) / previousMonthBalance) * 100;

  // Handle month navigation
  const goToPreviousMonth = () => {
    setSelectedDate(prevDate => subMonths(prevDate, 1));
  };

  const goToNextMonth = () => {
    setSelectedDate(prevDate => addMonths(prevDate, 1));
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

  // Combine current and previous month transactions
  const combinedTransactions = [...selectedMonthTransactions, ...previousMonthTransactions].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium">
            {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Receitas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <span className="text-2xl font-bold text-green-600">
                R$ {selectedMonthIncome.toFixed(2)}
              </span>
              <div className="flex items-center gap-1 text-sm">
                <span className={incomeVariation >= 0 ? "text-green-600" : "text-red-600"}>
                  {incomeVariation >= 0 ? "+" : ""}{incomeVariation.toFixed(1)}%
                </span>
                <span className="text-muted-foreground">vs mês anterior</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Mês anterior: R$ {previousMonthIncome.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Despesas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <span className="text-2xl font-bold text-red-600">
                R$ {selectedMonthExpenses.toFixed(2)}
              </span>
              <div className="flex items-center gap-1 text-sm">
                <span className={expensesVariation <= 0 ? "text-green-600" : "text-red-600"}>
                  {expensesVariation >= 0 ? "+" : ""}{expensesVariation.toFixed(1)}%
                </span>
                <span className="text-muted-foreground">vs mês anterior</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Mês anterior: R$ {previousMonthExpenses.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saldo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <span className={`text-2xl font-bold ${selectedMonthBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                R$ {selectedMonthBalance.toFixed(2)}
              </span>
              <div className="flex items-center gap-1 text-sm">
                <span className={balanceVariation >= 0 ? "text-green-600" : "text-red-600"}>
                  {balanceVariation >= 0 ? "+" : ""}{balanceVariation.toFixed(1)}%
                </span>
                <span className="text-muted-foreground">vs mês anterior</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Mês anterior: R$ {previousMonthBalance.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <FinancialInsights
        transactions={transactions}
        selectedDate={selectedDate}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <TransactionForm onSubmit={handleAddTransaction} />
        </div>
        <div className="md:col-span-2">
          <TransactionList
            transactions={combinedTransactions}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
