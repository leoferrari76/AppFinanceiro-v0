import React, { useState } from "react";
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

interface TransactionFormProps {
  onSubmit?: (data: TransactionData) => void;
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
}

const defaultIncomeCategories = [
  { value: "salary", label: "Salary" },
  { value: "freelance", label: "Freelance" },
  { value: "investment", label: "Investment" },
  { value: "gift", label: "Gift" },
  { value: "other", label: "Other" },
];

const defaultExpenseCategories = [
  { value: "housing", label: "Housing" },
  { value: "food", label: "Food" },
  { value: "transportation", label: "Transportation" },
  { value: "entertainment", label: "Entertainment" },
  { value: "utilities", label: "Utilities" },
  { value: "healthcare", label: "Healthcare" },
  { value: "recurring", label: "Recurring Payment" },
  { value: "other", label: "Other" },
];

const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit = () => {},
}) => {
  const { user } = useAuth();
  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "income",
  );
  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringStartDate, setRecurringStartDate] = useState<Date>(
    new Date(),
  );
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted', { description, amount, category, transactionType });

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

      console.log('Creating transaction with data:', transactionData);

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

      // Call the onSubmit callback if provided
      if (onSubmit) {
        console.log('Calling onSubmit callback with:', savedTransaction);
        onSubmit({
          ...savedTransaction,
          date: new Date(savedTransaction.date),
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
    } else {
      setCategory(value);
      setIsRecurring(value === "recurring");
    }
  };

  const handleAddNewCategory = () => {
    if (!newCategoryName.trim()) return;

    const newCategory = {
      value: newCategoryName.toLowerCase().replace(/\s+/g, "-"),
      label: newCategoryName.trim(),
    };

    if (transactionType === "income") {
      setIncomeCategories((prev) => [
        ...prev.filter((cat) => cat.value !== "other"),
        newCategory,
        { value: "other", label: "Other" },
      ]);
    } else {
      setExpenseCategories((prev) => [
        ...prev.filter((cat) => cat.value !== "other"),
        newCategory,
        { value: "other", label: "Other" },
      ]);
    }

    setCategory(newCategory.value);
    setNewCategoryName("");
    setIsNewCategoryDialogOpen(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-background">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-center">
          Add Transaction
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="income"
          value={transactionType}
          onValueChange={(value) => {
            console.log('Transaction type changed:', value);
            setTransactionType(value as "income" | "expense");
          }}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expense">Expense</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    id="date"
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      if (newDate) {
                        console.log('Date selected:', newDate);
                        setDate(newDate);
                        setIsCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter transaction description"
                value={description}
                onChange={(e) => {
                  console.log('Description changed:', e.target.value);
                  setDescription(e.target.value);
                }}
                className="resize-none"
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  $
                </span>
                <Input
                  id="amount"
                  type="text"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    console.log('Amount changed:', e.target.value);
                    handleAmountChange(e);
                  }}
                  className="pl-7"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={category} 
                onValueChange={(value) => {
                  console.log('Category changed:', value);
                  handleCategoryChange(value);
                }}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recurring Payment Fields */}
            {isRecurring && (
              <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                <h3 className="font-medium">Recurring Payment Details</h3>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="recurringStartDate">Start Date</Label>
                  <Popover
                    open={isStartDateCalendarOpen}
                    onOpenChange={setIsStartDateCalendarOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        id="recurringStartDate"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {recurringStartDate ? (
                          format(recurringStartDate, "PPP")
                        ) : (
                          <span>Pick a start date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={recurringStartDate}
                        onSelect={(newDate) => {
                          if (newDate) {
                            setRecurringStartDate(newDate);
                            setIsStartDateCalendarOpen(false);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label htmlFor="recurringEndDate">End Date</Label>
                  <Popover
                    open={isEndDateCalendarOpen}
                    onOpenChange={setIsEndDateCalendarOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        id="recurringEndDate"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {recurringEndDate ? (
                          format(recurringEndDate, "PPP")
                        ) : (
                          <span>Pick an end date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={recurringEndDate}
                        onSelect={(newDate) => {
                          if (newDate) {
                            setRecurringEndDate(newDate);
                            setIsEndDateCalendarOpen(false);
                          }
                        }}
                        initialFocus
                        disabled={(date) => date < recurringStartDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full"
              onClick={() => console.log('Submit button clicked')}
            >
              Add {transactionType === "income" ? "Income" : "Expense"}
            </Button>
          </form>
        </Tabs>

        {/* New Category Dialog */}
        <Dialog
          open={isNewCategoryDialogOpen}
          onOpenChange={setIsNewCategoryDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="newCategory">Category Name</Label>
              <Input
                id="newCategory"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter new category name"
                className="mt-2"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setNewCategoryName("");
                  setIsNewCategoryDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddNewCategory}
                disabled={!newCategoryName.trim()}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TransactionForm;
