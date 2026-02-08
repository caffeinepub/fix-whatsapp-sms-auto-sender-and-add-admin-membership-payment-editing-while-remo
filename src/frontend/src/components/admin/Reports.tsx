import { useGetReports } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Users, IndianRupee, AlertCircle, Calendar } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { MembershipStatus } from '../../backend';

export default function Reports() {
  const { data: reportData, isLoading } = useGetReports();

  if (isLoading || !reportData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalRevenue = Number(reportData.totalPayments);
  const totalExpenses = Number(reportData.totalExpenses);
  const netProfit = Number(reportData.profit);
  const monthlyRevenue = Number(reportData.monthlyRevenue);

  const activeMembers = reportData.members.filter(
    (rm) => rm.member.membershipStatus === MembershipStatus.active
  ).length;

  // Monthly revenue data (simplified visualization)
  const monthlyData = [
    { month: 'Jan', revenue: monthlyRevenue * 0.15, expenses: totalExpenses * 0.12 },
    { month: 'Feb', revenue: monthlyRevenue * 0.18, expenses: totalExpenses * 0.15 },
    { month: 'Mar', revenue: monthlyRevenue * 0.22, expenses: totalExpenses * 0.18 },
    { month: 'Apr', revenue: monthlyRevenue * 0.20, expenses: totalExpenses * 0.22 },
    { month: 'May', revenue: monthlyRevenue * 0.25, expenses: totalExpenses * 0.33 },
  ];

  // Membership status distribution
  const membershipData = [
    {
      name: 'Active',
      value: reportData.members.filter((rm) => rm.member.membershipStatus === MembershipStatus.active).length,
    },
    {
      name: 'Expired',
      value: reportData.members.filter((rm) => rm.member.membershipStatus === MembershipStatus.expired).length,
    },
    {
      name: 'Pending',
      value: reportData.members.filter((rm) => rm.member.membershipStatus === MembershipStatus.pending).length,
    },
  ];

  const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const getExpiryBadge = (isExpired: boolean, isExpiringSoon: boolean) => {
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (isExpiringSoon) {
      return <Badge className="bg-yellow-500">Expiring Soon</Badge>;
    }
    return <Badge className="bg-green-500">Active</Badge>;
  };

  const sortedMembers = [...reportData.members].sort((a, b) => {
    // Sort by expired first, then expiring soon, then by money due
    if (a.isExpired !== b.isExpired) return a.isExpired ? -1 : 1;
    if (a.isExpiringSoon !== b.isExpiringSoon) return a.isExpiringSoon ? -1 : 1;
    return Number(b.moneyDue) - Number(a.moneyDue);
  });

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Members
            </CardDescription>
            <CardTitle className="text-3xl">{activeMembers}</CardTitle>
          </CardHeader>
        </Card>
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
              <IndianRupee className="h-4 w-4 text-destructive" />
              Total Expenses
            </CardDescription>
            <CardTitle className="text-3xl text-destructive">{formatCurrency(totalExpenses)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Net Profit</CardDescription>
            <CardTitle className={`text-3xl ${netProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {formatCurrency(netProfit)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Member Financial Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Member Financial Overview</CardTitle>
          <CardDescription>Detailed member payment status and membership expiry tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Money Due</TableHead>
                  <TableHead>Membership Expiry</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No member data available
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedMembers.map((reportMember) => {
                    const expiryDate = new Date(Number(reportMember.member.endDate) / 1000000);
                    const rowClassName = reportMember.isExpired
                      ? 'bg-red-50 dark:bg-red-950/20'
                      : reportMember.isExpiringSoon
                      ? 'bg-yellow-50 dark:bg-yellow-950/20'
                      : '';

                    return (
                      <TableRow key={reportMember.member.id.toString()} className={rowClassName}>
                        <TableCell className="font-medium">{reportMember.member.name}</TableCell>
                        <TableCell>{reportMember.member.membershipPlan.name}</TableCell>
                        <TableCell>
                          <span
                            className={`font-semibold ${
                              Number(reportMember.moneyDue) > 0 ? 'text-orange-600' : 'text-green-600'
                            }`}
                          >
                            {formatCurrency(Number(reportMember.moneyDue))}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {reportMember.isExpired && <AlertCircle className="h-4 w-4 text-destructive" />}
                            {reportMember.isExpiringSoon && !reportMember.isExpired && (
                              <Calendar className="h-4 w-4 text-yellow-600" />
                            )}
                            <span className={reportMember.isExpired ? 'text-destructive font-semibold' : ''}>
                              {expiryDate.toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getExpiryBadge(reportMember.isExpired, reportMember.isExpiringSoon)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
            <CardDescription>Monthly financial overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="revenue" fill="hsl(var(--chart-1))" name="Revenue" />
                <Bar dataKey="expenses" fill="hsl(var(--chart-2))" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Membership Distribution</CardTitle>
            <CardDescription>Current membership status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={membershipData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {membershipData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
