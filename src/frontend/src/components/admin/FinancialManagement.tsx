import { useState } from 'react';
import { 
  useGetAllPayments, 
  useGetAllExpenses, 
  useAddPaymentByIdentifier, 
  useAddExpense, 
  useGetAllMembers,
  useUpdatePayment,
  useDeletePayment,
  useDeleteExpense
} from '../../hooks/useQueries';
import { Expense, PaymentStatus, ExpenseType, Payment } from '../../backend';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Plus, Loader2, IndianRupee, TrendingUp, TrendingDown, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function FinancialManagement() {
  const { data: payments = [], isLoading: paymentsLoading } = useGetAllPayments();
  const { data: expenses = [], isLoading: expensesLoading } = useGetAllExpenses();
  const { data: members = [] } = useGetAllMembers();
  const addPaymentByIdentifier = useAddPaymentByIdentifier();
  const addExpense = useAddExpense();
  const updatePayment = useUpdatePayment();
  const deletePayment = useDeletePayment();
  const deleteExpense = useDeleteExpense();

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isEditPaymentDialogOpen, setIsEditPaymentDialogOpen] = useState(false);
  const [isDeletePaymentDialogOpen, setIsDeletePaymentDialogOpen] = useState(false);
  const [isDeleteExpenseDialogOpen, setIsDeleteExpenseDialogOpen] = useState(false);

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const [paymentForm, setPaymentForm] = useState({
    memberIdentifier: '',
    amount: '',
    status: PaymentStatus.paid,
  });

  const [editPaymentForm, setEditPaymentForm] = useState({
    amount: '',
    status: PaymentStatus.paid,
  });

  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    type: ExpenseType.equipment,
  });

  const handleAddPayment = async () => {
    if (!paymentForm.memberIdentifier || !paymentForm.amount) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await addPaymentByIdentifier.mutateAsync({
        identifier: paymentForm.memberIdentifier.trim(),
        amount: BigInt(Math.round(parseFloat(paymentForm.amount))),
        status: paymentForm.status,
      });
      toast.success('Payment recorded successfully');
      setIsPaymentDialogOpen(false);
      setPaymentForm({ memberIdentifier: '', amount: '', status: PaymentStatus.paid });
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to record payment';
      if (errorMessage.includes('does not belong to any member')) {
        toast.error('Member not found with the provided email or phone');
      } else {
        toast.error(errorMessage);
      }
      console.error(error);
    }
  };

  const handleEditPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setEditPaymentForm({
      amount: payment.amount.toString(),
      status: payment.status,
    });
    setIsEditPaymentDialogOpen(true);
  };

  const handleUpdatePayment = async () => {
    if (!selectedPayment || !editPaymentForm.amount) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const updatedPayment: Payment = {
        ...selectedPayment,
        amount: BigInt(Math.round(parseFloat(editPaymentForm.amount))),
        status: editPaymentForm.status,
      };

      await updatePayment.mutateAsync(updatedPayment);
      toast.success('Payment updated successfully');
      setIsEditPaymentDialogOpen(false);
      setSelectedPayment(null);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update payment';
      toast.error(errorMessage);
      console.error(error);
    }
  };

  const handleDeletePaymentClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDeletePaymentDialogOpen(true);
  };

  const handleConfirmDeletePayment = async () => {
    if (!selectedPayment) return;

    try {
      await deletePayment.mutateAsync(selectedPayment.id);
      toast.success('Payment deleted successfully');
      setIsDeletePaymentDialogOpen(false);
      setSelectedPayment(null);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to delete payment';
      toast.error(errorMessage);
      console.error(error);
    }
  };

  const handleDeleteExpenseClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDeleteExpenseDialogOpen(true);
  };

  const handleConfirmDeleteExpense = async () => {
    if (!selectedExpense) return;

    try {
      await deleteExpense.mutateAsync(selectedExpense.id);
      toast.success('Expense deleted successfully');
      setIsDeleteExpenseDialogOpen(false);
      setSelectedExpense(null);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to delete expense';
      toast.error(errorMessage);
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

  // Helper to get member display name from email
  const getMemberDisplayName = (email: string): string => {
    const member = members.find(m => m.email === email);
    return member ? `${member.name} (${email})` : email;
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
                        <Label htmlFor="memberIdentifier">Member Email or Phone</Label>
                        <Input
                          id="memberIdentifier"
                          placeholder="Enter member email or phone number"
                          value={paymentForm.memberIdentifier}
                          onChange={(e) => setPaymentForm({ ...paymentForm, memberIdentifier: e.target.value })}
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
                      <Button onClick={handleAddPayment} disabled={addPaymentByIdentifier.isPending}>
                        {addPaymentByIdentifier.isPending ? (
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
                      <TableHead>Member</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No payments recorded
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-sm">{payment.id}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {getMemberDisplayName(payment.email)}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(Number(payment.amount))}
                          </TableCell>
                          <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                          <TableCell>
                            {new Date(Number(payment.timestamp) / 1000000).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditPayment(payment)}
                                title="Edit payment"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeletePaymentClick(payment)}
                                title="Delete payment"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
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
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteExpenseClick(expense)}
                              title="Delete expense"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
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

      {/* Edit Payment Dialog */}
      <Dialog open={isEditPaymentDialogOpen} onOpenChange={setIsEditPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>Update payment details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editPaymentId">Payment ID</Label>
              <Input
                id="editPaymentId"
                value={selectedPayment?.id || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAmount">Amount (₹)</Label>
              <Input
                id="editAmount"
                type="number"
                step="1"
                placeholder="0"
                value={editPaymentForm.amount}
                onChange={(e) => setEditPaymentForm({ ...editPaymentForm, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPaymentStatus">Status</Label>
              <Select
                value={editPaymentForm.status}
                onValueChange={(value) =>
                  setEditPaymentForm({ ...editPaymentForm, status: value as PaymentStatus })
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
            <Button variant="outline" onClick={() => setIsEditPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePayment} disabled={updatePayment.isPending}>
              {updatePayment.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Confirmation Dialog */}
      <AlertDialog open={isDeletePaymentDialogOpen} onOpenChange={setIsDeletePaymentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment record? This action cannot be undone.
              {selectedPayment && (
                <div className="mt-4 rounded-md bg-muted p-3 text-sm">
                  <p><strong>Payment ID:</strong> {selectedPayment.id}</p>
                  <p><strong>Amount:</strong> {formatCurrency(Number(selectedPayment.amount))}</p>
                  <p><strong>Member:</strong> {getMemberDisplayName(selectedPayment.email)}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeletePayment}
              disabled={deletePayment.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePayment.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Payment'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Expense Confirmation Dialog */}
      <AlertDialog open={isDeleteExpenseDialogOpen} onOpenChange={setIsDeleteExpenseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense record? This action cannot be undone.
              {selectedExpense && (
                <div className="mt-4 rounded-md bg-muted p-3 text-sm">
                  <p><strong>Expense ID:</strong> {selectedExpense.id}</p>
                  <p><strong>Description:</strong> {selectedExpense.description}</p>
                  <p><strong>Amount:</strong> {formatCurrency(Number(selectedExpense.amount))}</p>
                  <p><strong>Type:</strong> {selectedExpense.type}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteExpense}
              disabled={deleteExpense.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteExpense.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Expense'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
