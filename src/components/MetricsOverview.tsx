import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon, DollarSignIcon } from "lucide-react";

interface MetricsOverviewProps {
  income: number;
  expenses: number;
  balance: number;
  month?: string;
}

const MetricsOverview = ({
  income = 2500,
  expenses = 1800,
  balance = 700,
  month = "May 2023",
}: MetricsOverviewProps) => {
  return (
    <div className="w-full bg-background p-4 rounded-lg">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Financial Overview</h2>
        <p className="text-muted-foreground">{month}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Income Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Monthly Income
                </p>
                <h3 className="text-2xl font-bold text-green-600">
                  ${income.toLocaleString()}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <ArrowUpIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Monthly Expenses
                </p>
                <h3 className="text-2xl font-bold text-red-600">
                  ${expenses.toLocaleString()}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <ArrowDownIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Current Balance
                </p>
                <h3
                  className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  ${Math.abs(balance).toLocaleString()}
                  {balance < 0 && " (Deficit)"}
                </h3>
              </div>
              <div
                className={`h-12 w-12 rounded-full ${balance >= 0 ? "bg-green-100" : "bg-red-100"} flex items-center justify-center`}
              >
                <DollarSignIcon
                  className={`h-6 w-6 ${balance >= 0 ? "text-green-600" : "text-red-600"}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MetricsOverview;
