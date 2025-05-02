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

interface TransactionFormProps {
  onSubmit?: (data: TransactionData) => void;
}

interface TransactionData {
  type: "income" | "expense";
  date: Date;
  description: string;
  amount: number;
  category: string;
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
  { value: "other", label: "Other" },
];

const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit = () => {},
}) => {
  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "income",
  );
  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [incomeCategories, setIncomeCategories] = useState([
    ...defaultIncomeCategories,
  ]);
  const [expenseCategories, setExpenseCategories] = useState([
    ...defaultExpenseCategories,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!description || !amount || !category) {
      // In a real app, you would show validation errors
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      // Handle invalid amount
      return;
    }

    const transactionData: TransactionData = {
      type: transactionType,
      date,
      description,
      amount: parsedAmount,
      category,
    };

    onSubmit(transactionData);

    // Reset form
    setDescription("");
    setAmount("");
    setCategory("");
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
          onValueChange={(value) =>
            setTransactionType(value as "income" | "expense")
          }
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
                onChange={(e) => setDescription(e.target.value)}
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
                  onChange={handleAmountChange}
                  className="pl-7"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={handleCategoryChange}>
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

            {/* Submit Button */}
            <Button type="submit" className="w-full">
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
