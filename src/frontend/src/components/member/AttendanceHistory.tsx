import { useGetMemberAttendance } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, ClipboardList } from 'lucide-react';

export default function AttendanceHistory() {
  const { data: attendance = [], isLoading } = useGetMemberAttendance();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const sortedAttendance = [...attendance].sort(
    (a, b) => Number(b.checkInTime) - Number(a.checkInTime)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance History</CardTitle>
        <CardDescription>Your gym check-in records</CardDescription>
      </CardHeader>
      <CardContent>
        {attendance.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No Attendance Records</h3>
            <p className="text-sm text-muted-foreground">
              Your attendance history will appear here after your first check-in.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAttendance.map((record, index) => {
                  const checkInDate = new Date(Number(record.checkInTime) / 1000000);
                  const checkOutDate = record.checkOutTime
                    ? new Date(Number(record.checkOutTime) / 1000000)
                    : null;
                  const duration = checkOutDate
                    ? Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60))
                    : null;

                  return (
                    <TableRow key={index}>
                      <TableCell>{checkInDate.toLocaleDateString()}</TableCell>
                      <TableCell>{checkInDate.toLocaleTimeString()}</TableCell>
                      <TableCell>
                        {checkOutDate ? checkOutDate.toLocaleTimeString() : 'In progress'}
                      </TableCell>
                      <TableCell>{duration ? `${duration} min` : '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
