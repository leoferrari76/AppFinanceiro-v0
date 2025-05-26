import React, { useState } from "react";
import { format, isSameMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUpDown, Edit, Trash2, Filter, ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Transaction {
  id: string;
  date: Date;
  category: string;
  description: string;
  amount: number;
  type: "income" | "expense";
}

interface TransactionListProps {
  transactions?: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  selectedDate: Date;
}

const TransactionList = ({
  transactions = [],
  onEdit = () => {},
  onDelete = () => {},
  selectedDate,
}: TransactionListProps) => {
  const [sortField, setSortField] = useState<keyof Transaction>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const isTransactionFromSelectedMonth = (date: Date) => {
    return isSameMonth(date, selectedDate);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    // Filter by type
    if (filterType !== "all" && transaction.type !== filterType) {
      return false;
    }

    // Filter by search term
    if (
      searchTerm &&
      !(
        transaction.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    ) {
      return false;
    }

    // Filter by selected month
    if (!isSameMonth(transaction.date, selectedDate)) {
      return false;
    }

    return true;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortField === "date") {
      return sortDirection === "asc"
        ? a.date.getTime() - b.date.getTime()
        : b.date.getTime() - a.date.getTime();
    }

    if (sortField === "amount") {
      return sortDirection === "asc"
        ? a.amount - b.amount
        : b.amount - a.amount;
    }

    // Sort by string fields
    const aValue = String(a[sortField]).toLowerCase();
    const bValue = String(b[sortField]).toLowerCase();

    return sortDirection === "asc"
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  const handleSort = (field: keyof Transaction) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailsDialogOpen(true);
  };

  const handleEditClick = (transaction: Transaction) => {
    setDetailsDialogOpen(false);
    onEdit(transaction);
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTransaction) {
      onDelete(selectedTransaction.id);
      setDeleteDialogOpen(false);
      if (detailsDialogOpen) setDetailsDialogOpen(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  // Group transactions by category
  const groupedTransactions = sortedTransactions.reduce((acc, transaction) => {
    const category = transaction.category;
    if (!acc[category]) {
      acc[category] = {
        transactions: [],
        total: 0,
        type: transaction.type,
      };
    }
    acc[category].transactions.push(transaction);
    acc[category].total += transaction.amount;
    return acc;
  }, {} as Record<string, { transactions: Transaction[]; total: number; type: "income" | "expense" }>);

  // Sort categories by total amount
  const sortedCategories = Object.entries(groupedTransactions).sort((a, b) => {
    return b[1].total - a[1].total;
  });

  // Calculate category totals for the last 3 months
  const getCategoryHistory = (category: string, type: "income" | "expense") => {
    const history = [];
    for (let i = 0; i < 3; i++) {
      const monthDate = subMonths(selectedDate, i);
      const monthTotal = transactions
        .filter(
          (t) =>
            t.category === category &&
            t.type === type &&
            isSameMonth(t.date, monthDate)
        )
        .reduce((sum, t) => sum + t.amount, 0);
      
      history.push({
        month: monthDate,
        total: monthTotal,
      });
    }
    return history;
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle>Transações</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar transações"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select
                value={filterType}
                onValueChange={(value) =>
                  setFilterType(value as "all" | "income" | "expense")
                }
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Filtrar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Receitas</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {sortedCategories.map(([category, { transactions, total, type }]) => {
            const history = getCategoryHistory(category, type);
            return (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={type === "income" ? "default" : "destructive"}
                        className={type === "income" ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {transactions.length} {transactions.length === 1 ? "transação" : "transações"}
                      </span>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={`font-semibold ${type === "income" ? "text-green-600" : "text-red-600"}`}>
                            {type === "income" ? "+" : "-"}R$ {total.toFixed(2)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="p-4">
                          <div className="space-y-2">
                            <h4 className="font-medium">Histórico dos últimos 3 meses</h4>
                            {history.map(({ month, total }) => (
                              <div key={month.toISOString()} className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                  {format(month, "MMMM 'de' yyyy", { locale: ptBR })}
                                </span>
                                <span className={`font-medium ${type === "income" ? "text-green-600" : "text-red-600"}`}>
                                  {type === "income" ? "+" : "-"}R$ {total.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow
                          key={transaction.id}
                        >
                          <TableCell>
                            {format(transaction.date, "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell
                            className={`text-right ${
                              transaction.type === "income" ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {transaction.type === "income" ? "+" : "-"}R$ {transaction.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(transaction)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(transaction)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>

      {/* Transaction Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Transação</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Data
                  </p>
                  <p>{format(selectedTransaction.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Tipo
                  </p>
                  <Badge
                    variant={
                      selectedTransaction.type === "income"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {selectedTransaction.type === "income" ? "Receita" : "Despesa"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Categoria
                  </p>
                  <p>{selectedTransaction.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Valor
                  </p>
                  <p
                    className={
                      selectedTransaction.type === "income"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {selectedTransaction.type === "income" ? "+" : "-"}
                    {formatCurrency(selectedTransaction.amount)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Descrição
                </p>
                <p>{selectedTransaction.description}</p>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setDetailsDialogOpen(false)}
            >
              Fechar
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  selectedTransaction && handleEditClick(selectedTransaction)
                }
              >
                <Edit className="h-4 w-4 mr-2" /> Editar
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  selectedTransaction && handleDeleteClick(selectedTransaction)
                }
              >
                <Trash2 className="h-4 w-4 mr-2" /> Excluir
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a transação
              {selectedTransaction &&
                ` "${selectedTransaction.description}"`}{" "}
              dos seus registros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default TransactionList;
