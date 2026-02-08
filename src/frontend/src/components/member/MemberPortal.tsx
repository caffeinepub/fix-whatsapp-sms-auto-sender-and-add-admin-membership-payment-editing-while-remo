import { useState } from 'react';
import { useGetMemberProfile, useGetMemberAttendance, useGetMemberClassBookings, useGetMemberPayments, useGetMemberNotifications } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Loader2, Calendar, Dumbbell, Apple, TrendingUp, Clock, CreditCard, Users, AlertCircle } from 'lucide-react';
import { MembershipStatus, BookingStatus } from '../../backend';
import ProfilePictureModal from '../ProfilePictureModal';
import NotificationBanner from './NotificationBanner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function MemberPortal() {
  const { data: memberProfile, isLoading: profileLoading } = useGetMemberProfile();
  const { data: attendance = [], isLoading: attendanceLoading } = useGetMemberAttendance();
  const { data: classBookings = [], isLoading: bookingsLoading } = useGetMemberClassBookings();
  const { data: payments = [], isLoading: paymentsLoading } = useGetMemberPayments();
  const { data: notifications = [], isLoading: notificationsLoading } = useGetMemberNotifications();
  const [profilePicModalOpen, setProfilePicModalOpen] = useState(false);

  const isLoading = profileLoading || attendanceLoading || bookingsLoading || paymentsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!memberProfile) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Profile Not Found</AlertTitle>
        <AlertDescription>
          No member profile found. Please contact the gym administrator for assistance.
        </AlertDescription>
      </Alert>
    );
  }

  const daysUntilExpiry = Math.ceil(
    (Number(memberProfile.endDate) / 1000000 - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const thisMonthAttendance = attendance.filter((record) => {
    const recordDate = new Date(Number(record.checkInTime) / 1000000);
    const now = new Date();
    return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
  }).length;

  const getMemberInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const profilePicUrl = memberProfile.profilePic?.getDirectURL();

  // Calculate payment totals
  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const planCost = Number(memberProfile.membershipPlan.price);
  const amountDue = Math.max(0, planCost - totalPaid);

  // Get upcoming bookings
  const upcomingBookings = classBookings
    .filter((booking) => booking.status === BookingStatus.booked)
    .sort((a, b) => Number(a.date) - Number(b.date))
    .slice(0, 3);

  // Get recent attendance
  const recentAttendance = [...attendance]
    .sort((a, b) => Number(b.checkInTime) - Number(a.checkInTime))
    .slice(0, 5);

  const formatClassType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatDuration = (checkIn: bigint, checkOut?: bigint) => {
    if (!checkOut) return 'In progress';
    const duration = Number(checkOut) - Number(checkIn);
    const hours = Math.floor(duration / (1000000 * 60 * 60));
    const minutes = Math.floor((duration % (1000000 * 60 * 60)) / (1000000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Member Portal</h1>
        <p className="text-muted-foreground">Your complete fitness dashboard</p>
      </div>

      {/* Notification Banners */}
      {!notificationsLoading && notifications.length > 0 && (
        <NotificationBanner notifications={notifications} />
      )}

      {/* Profile Overview Section */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Profile Overview</CardTitle>
          <CardDescription>Your membership information and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {/* Profile Picture */}
            <div className="flex flex-col items-center gap-2">
              <Avatar 
                className="h-32 w-32 cursor-pointer hover:opacity-80 transition-opacity border-4 border-primary/20" 
                onClick={() => profilePicUrl && setProfilePicModalOpen(true)}
              >
                {profilePicUrl ? (
                  <AvatarImage src={profilePicUrl} alt={memberProfile.name} />
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                    {getMemberInitials(memberProfile.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              {profilePicUrl && (
                <p className="text-xs text-muted-foreground text-center">
                  Click to view full size
                </p>
              )}
            </div>

            {/* Profile Details */}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-bold">{memberProfile.name}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <Badge
                    className={
                      memberProfile.membershipStatus === MembershipStatus.active
                        ? 'bg-green-500 hover:bg-green-600'
                        : memberProfile.membershipStatus === MembershipStatus.expired
                          ? 'bg-destructive hover:bg-destructive/90'
                          : 'bg-yellow-500 hover:bg-yellow-600'
                    }
                  >
                    {memberProfile.membershipStatus}
                  </Badge>
                  {memberProfile.membershipStatus === MembershipStatus.active && (
                    <span className="text-sm text-muted-foreground">
                      {daysUntilExpiry > 0 ? `${daysUntilExpiry} days remaining` : 'Expires today'}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base">{memberProfile.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-base">{memberProfile.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Membership Plan</p>
                  <p className="text-base font-semibold">{memberProfile.membershipPlan.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Plan Duration</p>
                  <p className="text-base">{memberProfile.membershipPlan.durationMonths} months</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                  <p className="text-base">
                    {new Date(Number(memberProfile.startDate) / 1000000).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expiry Date</p>
                  <p className="text-base font-semibold">
                    {new Date(Number(memberProfile.endDate) / 1000000).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              This Month
            </CardDescription>
            <CardTitle className="text-3xl">{thisMonthAttendance}</CardTitle>
            <p className="text-xs text-muted-foreground">Gym visits</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Visits
            </CardDescription>
            <CardTitle className="text-3xl">{attendance.length}</CardTitle>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Class Bookings
            </CardDescription>
            <CardTitle className="text-3xl">{upcomingBookings.length}</CardTitle>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Amount Due
            </CardDescription>
            <CardTitle className="text-3xl">₹{amountDue}</CardTitle>
            <p className="text-xs text-muted-foreground">Outstanding</p>
          </CardHeader>
        </Card>
      </div>

      {/* Two Column Layout for Plans */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Workout Plan Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              <CardTitle>Workout Plan</CardTitle>
            </div>
            <CardDescription>Your assigned training program</CardDescription>
          </CardHeader>
          <CardContent>
            {memberProfile.workoutPlan ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg">{memberProfile.workoutPlan.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {memberProfile.workoutPlan.description}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Duration: {Number(memberProfile.workoutPlan.durationWeeks)} weeks
                  </p>
                </div>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-medium">Exercises:</p>
                  {memberProfile.workoutPlan.exercises.map((exercise, index) => (
                    <div key={index} className="rounded-lg border bg-muted/50 p-3">
                      <p className="font-medium">{exercise.name}</p>
                      <div className="mt-1 flex gap-4 text-sm text-muted-foreground">
                        <span>{Number(exercise.sets)} sets</span>
                        <span>•</span>
                        <span>{Number(exercise.reps)} reps</span>
                        <span>•</span>
                        <span>{Number(exercise.weightKg)} kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Dumbbell className="mx-auto h-12 w-12 opacity-20" />
                <p className="mt-2">No workout plan assigned yet</p>
                <p className="text-sm">Contact your trainer to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diet Plan Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Apple className="h-5 w-5 text-primary" />
              <CardTitle>Diet Plan</CardTitle>
            </div>
            <CardDescription>Your personalized nutrition guide</CardDescription>
          </CardHeader>
          <CardContent>
            {memberProfile.dietPlan ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg">{memberProfile.dietPlan.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {memberProfile.dietPlan.description}
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-2 rounded-lg border bg-muted/50 p-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Calories</p>
                    <p className="font-semibold">{Number(memberProfile.dietPlan.calories)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Protein</p>
                    <p className="font-semibold">{Number(memberProfile.dietPlan.proteinG)}g</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Carbs</p>
                    <p className="font-semibold">{Number(memberProfile.dietPlan.carbsG)}g</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Fat</p>
                    <p className="font-semibold">{Number(memberProfile.dietPlan.fatG)}g</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-medium">Meals:</p>
                  {memberProfile.dietPlan.meals.map((meal, index) => (
                    <div key={index} className="rounded-lg border bg-muted/50 p-3">
                      <p className="font-medium">{meal.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{meal.description}</p>
                      <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                        <span>{Number(meal.calories)} cal</span>
                        <span>•</span>
                        <span>P: {Number(meal.proteinG)}g</span>
                        <span>•</span>
                        <span>C: {Number(meal.carbsG)}g</span>
                        <span>•</span>
                        <span>F: {Number(meal.fatG)}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Apple className="mx-auto h-12 w-12 opacity-20" />
                <p className="mt-2">No diet plan assigned yet</p>
                <p className="text-sm">Contact your nutritionist to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance History Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle>Attendance History</CardTitle>
          </div>
          <CardDescription>Your recent gym check-ins</CardDescription>
        </CardHeader>
        <CardContent>
          {recentAttendance.length > 0 ? (
            <div className="space-y-3">
              {recentAttendance.map((record, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                  <div>
                    <p className="font-medium">
                      {new Date(Number(record.checkInTime) / 1000000).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Check-in: {new Date(Number(record.checkInTime) / 1000000).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatDuration(record.checkInTime, record.checkOutTime)}
                    </p>
                    {record.checkOutTime && (
                      <p className="text-xs text-muted-foreground">
                        Out: {new Date(Number(record.checkOutTime) / 1000000).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Clock className="mx-auto h-12 w-12 opacity-20" />
              <p className="mt-2">No attendance records yet</p>
              <p className="text-sm">Check in at the gym to start tracking</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Class Bookings Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Class Bookings</CardTitle>
          </div>
          <CardDescription>Your upcoming group fitness sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length > 0 ? (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                  <div>
                    <p className="font-medium">{formatClassType(booking.classType)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(Number(booking.date) / 1000000).toLocaleDateString()} at{' '}
                      {new Date(Number(booking.date) / 1000000).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge
                    className={
                      booking.status === BookingStatus.booked
                        ? 'bg-green-500'
                        : booking.status === BookingStatus.cancelled
                          ? 'bg-destructive'
                          : 'bg-blue-500'
                    }
                  >
                    {booking.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Users className="mx-auto h-12 w-12 opacity-20" />
              <p className="mt-2">No upcoming class bookings</p>
              <p className="text-sm">Book a class to join group sessions</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Wallet Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle>Payment Wallet</CardTitle>
          </div>
          <CardDescription>Your payment history and outstanding balance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">₹{totalPaid}</p>
            </div>
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Plan Cost</p>
              <p className="text-2xl font-bold">₹{planCost}</p>
            </div>
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Amount Due</p>
              <p className={`text-2xl font-bold ${amountDue > 0 ? 'text-destructive' : 'text-green-600'}`}>
                ₹{amountDue}
              </p>
            </div>
          </div>

          <Separator />

          {/* Payment History */}
          <div>
            <p className="mb-3 text-sm font-medium">Recent Payments:</p>
            {payments.length > 0 ? (
              <div className="space-y-2">
                {payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                    <div>
                      <p className="font-medium">₹{Number(payment.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(Number(payment.timestamp) / 1000000).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      className={
                        payment.status === 'paid'
                          ? 'bg-green-500'
                          : payment.status === 'pending'
                            ? 'bg-yellow-500'
                            : 'bg-destructive'
                      }
                    >
                      {payment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                <CreditCard className="mx-auto h-10 w-10 opacity-20" />
                <p className="mt-2 text-sm">No payment records yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Picture Modal */}
      {profilePicUrl && (
        <ProfilePictureModal
          open={profilePicModalOpen}
          onOpenChange={setProfilePicModalOpen}
          imageUrl={profilePicUrl}
          altText={memberProfile.name}
        />
      )}
    </div>
  );
}

