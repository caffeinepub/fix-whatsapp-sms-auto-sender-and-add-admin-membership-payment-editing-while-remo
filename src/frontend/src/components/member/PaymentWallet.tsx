import { useGetMemberPayments } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, CreditCard, IndianRupee } from 'lucide-react';
import { PaymentStatus } from '../../backend';

export default function PaymentWallet() {
  const { data: payments = [], isLoading } = useGetMemberPayments();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalPaid = payments
    .filter((p) => p.status === PaymentStatus.paid)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalPending = payments
    .filter((p) => p.status === PaymentStatus.pending)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.paid:
        return <Badge className="bg-green-500">Paid</Badge>;
      case PaymentStatus.pending:
        return <Badge variant="secondary">Pending</Badge>;
      case PaymentStatus.failed:
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  const sortedPayments = [...payments].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-green-600" />
              Total Paid
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">{formatCurrency(totalPaid)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-orange-600" />
              Outstanding Balance
            </CardDescription>
            <CardTitle className="text-3xl text-orange-600">{formatCurrency(totalPending)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your membership payment records</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No Payment Records</h3>
              <p className="text-sm text-muted-foreground">
                Your payment history will appear here once payments are recorded.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">{payment.id}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(Number(payment.amount))}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        {new Date(Number(payment.timestamp) / 1000000).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
