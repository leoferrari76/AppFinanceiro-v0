import React, { useMemo } from "react";
import { format, subMonths, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, TrendingUp, TrendingDown, Lightbulb, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

interface FinancialInsightsProps {
  transactions: Transaction[];
  selectedDate: Date;
}

const FinancialInsights: React.FC<FinancialInsightsProps> = ({
  transactions,
  selectedDate,
}) => {
  const insights = useMemo(() => {
    const currentMonthTransactions = transactions.filter((t) =>
      isSameMonth(t.date, selectedDate)
    );

    const previousMonthTransactions = transactions.filter((t) =>
      isSameMonth(t.date, subMonths(selectedDate, 1))
    );

    const insightsList = [];

    // Análise de gastos por categoria
    const categoryExpenses = currentMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    // Encontrar categoria com maior gasto
    const highestExpenseCategory = Object.entries(categoryExpenses).sort(
      (a, b) => b[1] - a[1]
    )[0];

    if (highestExpenseCategory) {
      insightsList.push({
        type: "alert",
        title: "Categoria com Maior Gasto",
        description: `Você gastou R$ ${highestExpenseCategory[1].toFixed(
          2
        )} em ${highestExpenseCategory[0]} este mês. Considere revisar estes gastos.`,
        icon: AlertCircle,
      });
    }

    // Análise de tendência de gastos
    const currentMonthExpenses = currentMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const previousMonthExpenses = previousMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseVariation =
      previousMonthExpenses === 0
        ? 0
        : ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100;

    if (expenseVariation > 20) {
      insightsList.push({
        type: "warning",
        title: "Aumento Significativo de Gastos",
        description: `Seus gastos aumentaram ${expenseVariation.toFixed(
          1
        )}% em relação ao mês anterior.`,
        icon: TrendingUp,
      });
    } else if (expenseVariation < -20) {
      insightsList.push({
        type: "success",
        title: "Redução de Gastos",
        description: `Ótimo! Seus gastos diminuíram ${Math.abs(
          expenseVariation
        ).toFixed(1)}% em relação ao mês anterior.`,
        icon: TrendingDown,
      });
    }

    // Análise de saldo
    const currentMonthIncome = currentMonthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = currentMonthIncome - currentMonthExpenses;
    const savingsRate = (balance / currentMonthIncome) * 100;

    if (savingsRate < 20 && currentMonthIncome > 0) {
      insightsList.push({
        type: "suggestion",
        title: "Taxa de Poupança Baixa",
        description: `Sua taxa de poupança está em ${savingsRate.toFixed(
          1
        )}%. Considere aumentar para pelo menos 20% para uma melhor saúde financeira.`,
        icon: Lightbulb,
      });
    }

    // Análise de gastos recorrentes
    const recurringExpenses = currentMonthTransactions.filter(
      (t) => t.type === "expense" && t.is_recurring
    );

    if (recurringExpenses.length > 0) {
      const totalRecurring = recurringExpenses.reduce(
        (sum, t) => sum + t.amount,
        0
      );
      const percentageOfIncome = (totalRecurring / currentMonthIncome) * 100;

      if (percentageOfIncome > 50) {
        insightsList.push({
          type: "alert",
          title: "Gastos Fixos Elevados",
          description: `Seus gastos fixos representam ${percentageOfIncome.toFixed(
            1
          )}% da sua renda. Considere revisar suas assinaturas e gastos recorrentes.`,
          icon: AlertCircle,
        });
      }
    }

    return insightsList;
  }, [transactions, selectedDate]);

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {insights.map((insight, index) => (
        <div
          key={index}
          className="flex items-start gap-3 p-4 rounded-lg bg-muted/50"
        >
          <div className="mt-1">
            {insight.type === "warning" ? (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            ) : insight.type === "success" ? (
              <Info className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-sm md:text-base break-words">{insight.title}</h3>
            <p className="text-xs md:text-sm text-muted-foreground break-words">
              {insight.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FinancialInsights; 