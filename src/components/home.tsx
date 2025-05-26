import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, User, LogOut, Calendar as CalendarIcon, Search, Users } from "lucide-react";
import { format, subMonths, addMonths, isSameMonth, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import FinancialInsights from "./FinancialInsights";
import { toast } from "@/components/ui/use-toast";
import FinancialGroup from "@/components/FinancialGroup";
import { useAuth } from "@/contexts/AuthContext";
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from "@/services/transactions";
import MetricsOverview from "./MetricsOverview";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isCurrentMonth = isSameMonth(selectedDate, new Date());

  // Carregar transações quando o componente montar
  useEffect(() => {
    console.log('Home: Estado de autenticação:', { user: !!user, authLoading });
    
    if (!authLoading && user) {
      console.log('Home: Usuário autenticado, carregando transações');
      loadTransactions();
    }
  }, [user, authLoading]);

  // Se ainda estiver carregando a autenticação, mostrar loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, não renderizar nada
  if (!user) {
    return null;
  }

  const loadTransactions = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      console.log('Home: Carregando transações para o usuário:', user.id);
      const data = await getTransactions(user.id);
      console.log('Home: Transações carregadas:', data);
      
      if (!data) {
        console.log('Home: Nenhuma transação encontrada');
        setTransactions([]);
        return;
      }
      
      const formattedTransactions = data.map(transaction => ({
        ...transaction,
        date: new Date(transaction.date),
        recurring_start_date: transaction.recurring_start_date ? new Date(transaction.recurring_start_date) : undefined,
        recurring_end_date: transaction.recurring_end_date ? new Date(transaction.recurring_end_date) : undefined,
      }));
      
      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Home: Erro ao carregar transações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as transações.",
        variant: "destructive",
      });
      setTransactions([]);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  // Agrupar transações por categoria
  const getCategoryTotals = (type: "income" | "expense") => {
    return selectedMonthTransactions
      .filter(t => t.type === type)
      .reduce((acc, transaction) => {
        const category = transaction.category;
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += transaction.amount;
        return acc;
      }, {} as Record<string, number>);
  };

  const incomeByCategory = getCategoryTotals("income");
  const expensesByCategory = getCategoryTotals("expense");

  const handleLogout = async () => {
    try {
      await signOut(() => navigate("/login"));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8 bg-background min-h-screen">
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando transações...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Finanças Pessoais</h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar transações..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setIsCalendarOpen(true)}
              >
                <CalendarIcon className="h-4 w-4" />
                {format(selectedDate, "MMMM yyyy", { locale: ptBR })}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Tabs defaultValue="personal" className="space-y-4">
            <TabsList>
              <TabsTrigger value="personal" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                Pessoal
              </TabsTrigger>
              <TabsTrigger value="shared" className="gap-2">
                <Users className="h-4 w-4" />
                Compartilhado
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Receitas do Mês
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedMonthIncome)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {incomeVariation > 0 ? "+" : ""}
                      {incomeVariation.toFixed(1)}% em relação ao mês anterior
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Despesas do Mês
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(selectedMonthExpenses)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {expensesVariation > 0 ? "+" : ""}
                      {expensesVariation.toFixed(1)}% em relação ao mês anterior
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Saldo do Mês
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${
                        selectedMonthBalance >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(selectedMonthBalance)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {balanceVariation > 0 ? "+" : ""}
                      {balanceVariation.toFixed(1)}% em relação ao mês anterior
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Transações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedMonthTransactions.length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <FinancialInsights
                transactions={transactions}
                selectedDate={selectedDate}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <TransactionForm
                    onTransactionAdded={handleAddTransaction}
                    defaultDate={selectedDate}
                  />
                </div>
                <div className="lg:col-span-2">
                  <TransactionList
                    transactions={selectedMonthTransactions}
                    onTransactionDeleted={handleDeleteTransaction}
                    onTransactionUpdated={handleEditTransaction}
                    selectedDate={selectedDate}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shared" className="space-y-4">
              <FinancialGroup userId={user?.id} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default Home;
