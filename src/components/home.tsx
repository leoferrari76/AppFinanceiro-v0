import React, { useState } from "react";
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
import MetricsOverview from "./MetricsOverview";
import TransactionForm from "./TransactionForm";
import TransactionList from "./TransactionList";

interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  type: "income" | "expense";
}

const Home = () => {
  // State for current month/year view
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Mock transactions data
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "1",
      date: new Date(),
      description: "Monthly Salary",
      amount: 3500,
      category: "Salary",
      type: "income",
    },
    {
      id: "2",
      date: new Date(),
      description: "Freelance Project",
      amount: 850,
      category: "Freelance",
      type: "income",
    },
    {
      id: "3",
      date: new Date(),
      description: "Rent Payment",
      amount: 1200,
      category: "Housing",
      type: "expense",
    },
    {
      id: "4",
      date: new Date(),
      description: "Grocery Shopping",
      amount: 250,
      category: "Food",
      type: "expense",
    },
    {
      id: "5",
      date: new Date(),
      description: "Internet Bill",
      amount: 80,
      category: "Utilities",
      type: "expense",
    },
  ]);

  // Calculate metrics for the current month
  const currentMonthTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);
    return (
      transactionDate.getMonth() === currentDate.getMonth() &&
      transactionDate.getFullYear() === currentDate.getFullYear()
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
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentDate(prevMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentDate(nextMonth);
  };

  // Handle adding new transactions
  const handleAddTransaction = (newTransaction: Omit<Transaction, "id">) => {
    const transaction = {
      ...newTransaction,
      id: Math.random().toString(36).substring(2, 9), // Simple ID generation
    };
    setTransactions([...transactions, transaction]);
  };

  // Handle editing transactions
  const handleEditTransaction = (updatedTransaction: Transaction) => {
    setTransactions(
      transactions.map((t) =>
        t.id === updatedTransaction.id ? updatedTransaction : t,
      ),
    );
  };

  // Handle deleting transactions
  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
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
            {format(currentDate, "MMMM yyyy")}
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
