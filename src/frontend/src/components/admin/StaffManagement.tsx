import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function StaffManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Management</CardTitle>
        <CardDescription>Manage trainers, salaries, and work schedules</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">Staff Management Coming Soon</h3>
          <p className="text-sm text-muted-foreground">
            Trainer profiles, salary management, and shift scheduling will be available here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
