import React, { useMemo } from "react";
import { format, subMonths, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, TrendingUp, TrendingDown, Lightbulb } from "lucide-react";
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Insights Financeiros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`flex flex-col p-4 rounded-lg border ${
                insight.type === "alert"
                  ? "border-red-200 bg-red-50"
                  : insight.type === "warning"
                  ? "border-yellow-200 bg-yellow-50"
                  : insight.type === "success"
                  ? "border-green-200 bg-green-50"
                  : "border-blue-200 bg-blue-50"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`p-2 rounded-full ${
                    insight.type === "alert"
                      ? "bg-red-100 text-red-600"
                      : insight.type === "warning"
                      ? "bg-yellow-100 text-yellow-600"
                      : insight.type === "success"
                      ? "bg-green-100 text-green-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  <insight.icon className="h-5 w-5" />
                </div>
                <h3 className="font-medium text-sm md:text-base break-words">{insight.title}</h3>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant={
                    insight.type === "alert"
                      ? "destructive"
                      : insight.type === "warning"
                      ? "outline"
                      : "default"
                  }
                  className={
                    insight.type === "success"
                      ? "bg-green-600 hover:bg-green-700"
                      : ""
                  }
                >
                  {insight.type === "alert"
                    ? "Alerta"
                    : insight.type === "warning"
                    ? "Atenção"
                    : insight.type === "success"
                    ? "Sucesso"
                    : "Sugestão"}
                </Badge>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground break-words">
                {insight.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialInsights; 