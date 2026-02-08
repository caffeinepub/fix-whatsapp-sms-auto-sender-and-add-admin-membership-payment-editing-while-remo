import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '../components/DashboardLayout';
import MemberManagement from '../components/admin/MemberManagement';
import FinancialManagement from '../components/admin/FinancialManagement';
import StaffManagement from '../components/admin/StaffManagement';
import Reports from '../components/admin/Reports';
import { Users, DollarSign, UserCog, BarChart3 } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('members');

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your gym operations and view analytics</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Members</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Financial</span>
            </TabsTrigger>
            <TabsTrigger value="staff" className="gap-2">
              <UserCog className="h-4 w-4" />
              <span className="hidden sm:inline">Staff</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <MemberManagement />
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <FinancialManagement />
          </TabsContent>

          <TabsContent value="staff" className="space-y-4">
            <StaffManagement />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Reports />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
