import { useState } from 'react';
import { useGetAllPayments, useGetAllExpenses, useAddPayment, useAddExpense } from '../../hooks/useQueries';
import { Payment, Expense, PaymentStatus, ExpenseType } from '../../backend';
import { Principal } from '@dfinity/principal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Loader2, IndianRupee, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

export default function FinancialManagement() {
  const { data: payments = [], isLoading: paymentsLoading } = useGetAllPayments();
  const { data: expenses = [], isLoading: expensesLoading } = useGetAllExpenses();
  const addPayment = useAddPayment();
  const addExpense = useAddExpense();

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    memberId: '',
    amount: '',
    status: PaymentStatus.paid,
  });

  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    type: ExpenseType.equipment,
  });

  const handleAddPayment = async () => {
    if (!paymentForm.memberId || !paymentForm.amount) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const payment: Payment = {
        id: `PAY_${Date.now()}`,
        memberId: Principal.fromText(paymentForm.memberId),
        amount: BigInt(Math.round(parseFloat(paymentForm.amount))),
        timestamp: BigInt(Date.now() * 1000000),
        status: paymentForm.status,
      };

      await addPayment.mutateAsync(payment);
      toast.success('Payment recorded successfully');
      setIsPaymentDialogOpen(false);
      setPaymentForm({ memberId: '', amount: '', status: PaymentStatus.paid });
    } catch (error) {
      toast.error('Failed to record payment');
      console.error(error);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const expense: Expense = {
        id: `EXP_${Date.now()}`,
        description: expenseForm.description,
        amount: BigInt(Math.round(parseFloat(expenseForm.amount))),
        timestamp: BigInt(Date.now() * 1000000),
        type: expenseForm.type,
      };

      await addExpense.mutateAsync(expense);
      toast.success('Expense recorded successfully');
      setIsExpenseDialogOpen(false);
      setExpenseForm({ description: '', amount: '', type: ExpenseType.equipment });
    } catch (error) {
      toast.error('Failed to record expense');
      console.error(error);
    }
  };

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const netProfit = totalRevenue - totalExpenses;

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.paid:
        return <Badge className="bg-green-500">Paid</Badge>;
      case PaymentStatus.pending:
        return <Badge variant="secondary">Pending</Badge>;
      case PaymentStatus.failed:
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  if (paymentsLoading || expensesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Total Revenue
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">{formatCurrency(totalRevenue)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Total Expenses
            </CardDescription>
            <CardTitle className="text-3xl text-destructive">{formatCurrency(totalExpenses)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Net Profit
            </CardDescription>
            <CardTitle className={`text-3xl ${netProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {formatCurrency(netProfit)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Payments and Expenses Tabs */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Records</CardTitle>
                  <CardDescription>Track membership fees and payments</CardDescription>
                </div>
                <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Payment</DialogTitle>
                      <DialogDescription>Add a new payment record</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="memberId">Member Principal ID</Label>
                        <Input
                          id="memberId"
                          placeholder="Enter member principal ID"
                          value={paymentForm.memberId}
                          onChange={(e) => setPaymentForm({ ...paymentForm, memberId: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (₹)</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="1"
                          placeholder="0"
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentStatus">Status</Label>
                        <Select
                          value={paymentForm.status}
                          onValueChange={(value) =>
                            setPaymentForm({ ...paymentForm, status: value as PaymentStatus })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={PaymentStatus.paid}>Paid</SelectItem>
                            <SelectItem value={PaymentStatus.pending}>Pending</SelectItem>
                            <SelectItem value={PaymentStatus.failed}>Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddPayment} disabled={addPayment.isPending}>
                        {addPayment.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Recording...
                          </>
                        ) : (
                          'Record Payment'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Member ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No payments recorded
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-sm">{payment.id}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {payment.memberId.toString().slice(0, 10)}...
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(Number(payment.amount))}
                          </TableCell>
                          <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                          <TableCell>
                            {new Date(Number(payment.timestamp) / 1000000).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Expense Records</CardTitle>
                  <CardDescription>Track gym operational expenses</CardDescription>
                </div>
                <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Expense
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Expense</DialogTitle>
                      <DialogDescription>Add a new expense record</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          placeholder="Enter expense description"
                          value={expenseForm.description}
                          onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expenseAmount">Amount (₹)</Label>
                        <Input
                          id="expenseAmount"
                          type="number"
                          step="1"
                          placeholder="0"
                          value={expenseForm.amount}
                          onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expenseType">Type</Label>
                        <Select
                          value={expenseForm.type}
                          onValueChange={(value) =>
                            setExpenseForm({ ...expenseForm, type: value as ExpenseType })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ExpenseType.equipment}>Equipment</SelectItem>
                            <SelectItem value={ExpenseType.rent}>Rent</SelectItem>
                            <SelectItem value={ExpenseType.utilities}>Utilities</SelectItem>
                            <SelectItem value={ExpenseType.other}>Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddExpense} disabled={addExpense.isPending}>
                        {addExpense.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Recording...
                          </>
                        ) : (
                          'Record Expense'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Expense ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No expenses recorded
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-mono text-sm">{expense.id}</TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{expense.type}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(Number(expense.amount))}
                          </TableCell>
                          <TableCell>
                            {new Date(Number(expense.timestamp) / 1000000).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
