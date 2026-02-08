import { useState } from 'react';
import { useGetMemberClassBookings, useAddClassBooking, useUpdateClassBooking } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { ClassBooking, ClassType, BookingStatus } from '../../backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Calendar, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function ClassBookings() {
  const { identity } = useInternetIdentity();
  const { data: bookings = [], isLoading } = useGetMemberClassBookings();
  const addClassBooking = useAddClassBooking();
  const updateBooking = useUpdateClassBooking();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [classType, setClassType] = useState<ClassType>(ClassType.yoga);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');

  const handleBookClass = async () => {
    if (!identity) {
      toast.error('Not authenticated');
      return;
    }

    const dateTime = new Date(`${date}T${time}`);
    const booking: ClassBooking = {
      id: `BOOK_${Date.now()}`,
      memberId: identity.getPrincipal(),
      classType: classType,
      date: BigInt(dateTime.getTime() * 1000000),
      status: BookingStatus.booked,
    };

    try {
      await addClassBooking.mutateAsync(booking);
      toast.success('Class booked successfully');
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to book class');
      console.error(error);
    }
  };

  const handleCancelBooking = async (booking: ClassBooking) => {
    const updatedBooking: ClassBooking = {
      ...booking,
      status: BookingStatus.cancelled,
    };

    try {
      await updateBooking.mutateAsync({ id: booking.id, booking: updatedBooking });
      toast.success('Booking cancelled');
    } catch (error) {
      toast.error('Failed to cancel booking');
      console.error(error);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.booked:
        return <Badge className="bg-green-500">Booked</Badge>;
      case BookingStatus.cancelled:
        return <Badge variant="destructive">Cancelled</Badge>;
      case BookingStatus.completed:
        return <Badge variant="secondary">Completed</Badge>;
    }
  };

  const getClassTypeLabel = (type: ClassType) => {
    switch (type) {
      case ClassType.yoga:
        return 'Yoga';
      case ClassType.zumba:
        return 'Zumba';
      case ClassType.crossfit:
        return 'CrossFit';
      case ClassType.pilates:
        return 'Pilates';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const sortedBookings = [...bookings].sort((a, b) => Number(b.date) - Number(a.date));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Class Bookings</CardTitle>
              <CardDescription>Reserve your spot in group fitness classes</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Book Class
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Book a Class</DialogTitle>
                  <DialogDescription>Choose your class type and preferred time</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="classType">Class Type</Label>
                    <Select value={classType} onValueChange={(value) => setClassType(value as ClassType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ClassType.yoga}>Yoga</SelectItem>
                        <SelectItem value={ClassType.zumba}>Zumba</SelectItem>
                        <SelectItem value={ClassType.crossfit}>CrossFit</SelectItem>
                        <SelectItem value={ClassType.pilates}>Pilates</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBookClass} disabled={addClassBooking.isPending}>
                    {addClassBooking.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      'Book Class'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No Bookings Yet</h3>
              <p className="text-sm text-muted-foreground">
                Book your first class to get started with group fitness sessions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="space-y-1">
                      <h4 className="font-semibold">{getClassTypeLabel(booking.classType)}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(Number(booking.date) / 1000000).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(booking.status)}
                      {booking.status === BookingStatus.booked && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelBooking(booking)}
                          disabled={updateBooking.isPending}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
