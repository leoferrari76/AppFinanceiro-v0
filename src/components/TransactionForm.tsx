import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createTransaction } from "@/services/transactions";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { getFinancialGroups } from "@/services/financialGroups";
import { Switch } from "@/components/ui/switch";

interface Transaction {
  id: string;
  user_id: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  category: string;
  date: Date;
  is_recurring?: boolean;
  recurring_start_date?: Date;
  recurring_end_date?: Date;
  group_id?: string;
}

interface TransactionFormProps {
  onTransactionAdded: (transaction: Omit<Transaction, "id">) => Promise<void>;
  defaultDate?: Date;
}

interface TransactionData {
  type: "income" | "expense";
  date: Date;
  description: string;
  amount: number;
  category: string;
  is_recurring?: boolean;
  recurring_start_date?: Date;
  recurring_end_date?: Date;
  group_id?: string;
}

const defaultIncomeCategories = [
  { value: "salary", label: "Salário" },
  { value: "freelance", label: "Freelance" },
  { value: "investment", label: "Investimento" },
  { value: "gift", label: "Presente" },
  { value: "other", label: "Outro" },
];

const defaultExpenseCategories = [
  { value: "housing", label: "Moradia" },
  { value: "food", label: "Alimentação" },
  { value: "transportation", label: "Transporte" },
  { value: "entertainment", label: "Lazer" },
  { value: "utilities", label: "Contas" },
  { value: "healthcare", label: "Saúde" },
  { value: "recurring", label: "Pagamento Recorrente" },
  { value: "other", label: "Outro" },
];

const TransactionForm: React.FC<TransactionFormProps> = ({
  onTransactionAdded,
  defaultDate = new Date(),
}) => {
  const { user } = useAuth();
  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "income"
  );
  const [date, setDate] = useState<Date>(defaultDate);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringStartDate, setRecurringStartDate] = useState<Date>(new Date());
  const [recurringEndDate, setRecurringEndDate] = useState<Date>(new Date());
  const [isStartDateCalendarOpen, setIsStartDateCalendarOpen] = useState(false);
  const [isEndDateCalendarOpen, setIsEndDateCalendarOpen] = useState(false);
  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [incomeCategories, setIncomeCategories] = useState([
    ...defaultIncomeCategories,
  ]);
  const [expenseCategories, setExpenseCategories] = useState([
    ...defaultExpenseCategories,
  ]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  const loadGroups = async () => {
    if (!user) return;
    try {
      const data = await getFinancialGroups(user.id);
      setGroups(data);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted', { description, amount, category, transactionType, selectedGroup });

    // Basic validation
    if (!description || !amount || !category) {
      console.log('Validation failed', { description, amount, category });
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      console.log('Invalid amount', { amount });
      toast({
        title: "Erro",
        description: "Valor inválido",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      console.log('No user found');
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    try {
      const transactionData = {
        user_id: user.id,
        group_id: selectedGroup === "no_group" ? null : selectedGroup,
        type: transactionType,
        date: format(date, "yyyy-MM-dd"),
        description,
        amount: parsedAmount,
        category,
        is_recurring: isRecurring,
        ...(isRecurring && {
          recurring_start_date: format(recurringStartDate, "yyyy-MM-dd"),
          recurring_end_date: format(recurringEndDate, "yyyy-MM-dd"),
        }),
      };

      console.log('Creating/Updating transaction with data:', transactionData);

      const savedTransaction = await createTransaction(transactionData);
      console.log('Transaction saved:', savedTransaction);
      
      toast({
        title: "Sucesso",
        description: "Transação adicionada com sucesso",
      });

      // Reset form
      setDescription("");
      setAmount("");
      setCategory("");
      setIsRecurring(false);
      setDate(new Date());
      setRecurringStartDate(new Date());
      setRecurringEndDate(new Date());
      setSelectedGroup("");

      // Call the onSubmit callback if provided
      if (onTransactionAdded) {
        console.log('Calling onSubmit callback with:', savedTransaction);
        await onTransactionAdded({
          user_id: savedTransaction.user_id,
          group_id: savedTransaction.group_id,
          type: savedTransaction.type,
          date: new Date(savedTransaction.date),
          description: savedTransaction.description,
          amount: savedTransaction.amount,
          category: savedTransaction.category,
          is_recurring: savedTransaction.is_recurring,
          recurring_start_date: savedTransaction.recurring_start_date ? new Date(savedTransaction.recurring_start_date) : undefined,
          recurring_end_date: savedTransaction.recurring_end_date ? new Date(savedTransaction.recurring_end_date) : undefined,
        });
      }
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar transação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and decimal point
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setAmount(value);
  };

  const categories =
    transactionType === "income" ? incomeCategories : expenseCategories;

  const handleCategoryChange = (value: string) => {
    if (value === "other") {
      setIsNewCategoryDialogOpen(true);
      return;
    }
    setCategory(value);
    setIsRecurring(value === "recurring");
  };

  const handleAddNewCategory = () => {
    if (!newCategoryName.trim()) return;

    const newCategory = {
      value: newCategoryName.toLowerCase().replace(/\s+/g, '_'),
      label: newCategoryName
    };

    if (transactionType === "income") {
      setIncomeCategories(prev => [...prev, newCategory]);
    } else {
      setExpenseCategories(prev => [...prev, newCategory]);
    }

    setCategory(newCategory.value);
    setNewCategoryName("");
    setIsNewCategoryDialogOpen(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs
        defaultValue="income"
        value={transactionType}
        onValueChange={(value) => {
          console.log('Transaction type changed:', value);
          setTransactionType(value as "income" | "expense");
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="income">Receita</TabsTrigger>
          <TabsTrigger value="expense">Despesa</TabsTrigger>
        </TabsList>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {(transactionType === "income" ? incomeCategories : expenseCategories).map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0,00"
                className="text-right"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Digite a descrição"
            />
          </div>

          <div className="grid gap-2">
            <Label>Data</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy") : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => {
                    setDate(date || new Date());
                    setIsCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
            <Label htmlFor="recurring">Pagamento Recorrente</Label>
          </div>

          {isRecurring && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Popover open={isStartDateCalendarOpen} onOpenChange={setIsStartDateCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !recurringStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {recurringStartDate ? format(recurringStartDate, "dd/MM/yyyy") : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={recurringStartDate}
                      onSelect={(date) => {
                        setRecurringStartDate(date || new Date());
                        setIsStartDateCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data de Término</Label>
                <Popover open={isEndDateCalendarOpen} onOpenChange={setIsEndDateCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !recurringEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {recurringEndDate ? format(recurringEndDate, "dd/MM/yyyy") : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={recurringEndDate}
                      onSelect={(date) => {
                        setRecurringEndDate(date || new Date());
                        setIsEndDateCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Grupo Financeiro (opcional)</Label>
            <Select
              value={selectedGroup}
              onValueChange={setSelectedGroup}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_group">Nenhum grupo</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Tabs>

      <Dialog
        open={isNewCategoryDialogOpen}
        onOpenChange={setIsNewCategoryDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newCategory">Nome da Categoria</Label>
              <Input
                id="newCategory"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Digite o nome da categoria"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewCategoryDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddNewCategory}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DialogFooter>
        <Button type="submit" className="w-full">
          Adicionar Transação
        </Button>
      </DialogFooter>
    </form>
  );
};

export default TransactionForm;
