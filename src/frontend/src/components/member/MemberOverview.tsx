import { useState } from 'react';
import { useGetMemberProfile, useGetMemberAttendance } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Calendar, Dumbbell, Apple, TrendingUp } from 'lucide-react';
import { MembershipStatus } from '../../backend';
import ProfilePictureModal from '../ProfilePictureModal';

export default function MemberOverview() {
  const { data: memberProfile, isLoading: profileLoading } = useGetMemberProfile();
  const { data: attendance = [], isLoading: attendanceLoading } = useGetMemberAttendance();
  const [profilePicModalOpen, setProfilePicModalOpen] = useState(false);

  if (profileLoading || attendanceLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!memberProfile) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No member profile found. Please contact the gym administrator.</p>
        </CardContent>
      </Card>
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

  return (
    <div className="space-y-6">
      {/* Welcome Card with Profile Picture */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar 
              className="h-20 w-20 cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={() => profilePicUrl && setProfilePicModalOpen(true)}
            >
              {profilePicUrl ? (
                <AvatarImage src={profilePicUrl} alt={memberProfile.name} />
              ) : (
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getMemberInitials(memberProfile.name)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">Welcome back, {memberProfile.name}!</CardTitle>
              <CardDescription>Here's your fitness overview</CardDescription>
              {profilePicUrl && (
                <p className="text-xs text-muted-foreground mt-1">
                  Click profile picture to view full size
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Membership Status:</span>
            <Badge
              className={
                memberProfile.membershipStatus === MembershipStatus.active
                  ? 'bg-green-500'
                  : memberProfile.membershipStatus === MembershipStatus.expired
                    ? 'bg-destructive'
                    : 'bg-secondary'
              }
            >
              {memberProfile.membershipStatus}
            </Badge>
            {memberProfile.membershipStatus === MembershipStatus.active && (
              <span className="text-sm text-muted-foreground">
                ({daysUntilExpiry} days remaining)
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
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
              <Dumbbell className="h-4 w-4" />
              Workout Plan
            </CardDescription>
            <CardTitle className="text-lg">
              {memberProfile.workoutPlan ? memberProfile.workoutPlan.name : 'Not assigned'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Apple className="h-4 w-4" />
              Diet Plan
            </CardDescription>
            <CardTitle className="text-lg">
              {memberProfile.dietPlan ? memberProfile.dietPlan.name : 'Not assigned'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{memberProfile.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{memberProfile.phone}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Membership Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium">
                {new Date(Number(memberProfile.startDate) / 1000000).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">End Date</p>
              <p className="font-medium">
                {new Date(Number(memberProfile.endDate) / 1000000).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

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
