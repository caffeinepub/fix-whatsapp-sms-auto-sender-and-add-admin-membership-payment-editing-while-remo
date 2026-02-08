import { useState, useEffect } from 'react';
import { useGetCallerUserProfile, useSaveCallerUserProfile, useGetCallerUserRole, useAssignRole, useGetUserRole } from '../hooks/useQueries';
import { UserProfile, UserRole, AppRole } from '../backend';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Principal } from '@dfinity/principal';
import { ExternalBlob } from '../backend';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Upload, User, Shield, Key } from 'lucide-react';
import ProfilePictureModal from './ProfilePictureModal';

interface ProfileSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileSettings({ open, onOpenChange }: ProfileSettingsProps) {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: userRole } = useGetCallerUserRole();
  const saveProfile = useSaveCallerUserProfile();
  const assignRole = useAssignRole();
  const getUserRole = useGetUserRole();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [targetPrincipal, setTargetPrincipal] = useState('');
  const [targetRole, setTargetRole] = useState<UserRole | null>(null);
  const [loadingTargetRole, setLoadingTargetRole] = useState(false);
  const [profilePicModalOpen, setProfilePicModalOpen] = useState(false);

  const isAdmin = userRole === UserRole.admin;

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name);
      setEmail(userProfile.email);
      if (userProfile.profilePic) {
        setProfilePicUrl(userProfile.profilePic.getDirectURL());
      }
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    if (!identity || !userProfile) return;

    try {
      const updatedProfile: UserProfile = {
        ...userProfile,
        name,
        email,
      };

      await saveProfile.mutateAsync(updatedProfile);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !identity || !userProfile) return;

    try {
      setUploadingPic(true);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes);

      const updatedProfile: UserProfile = {
        ...userProfile,
        profilePic: blob,
      };

      await saveProfile.mutateAsync(updatedProfile);
      setProfilePicUrl(blob.getDirectURL());
      toast.success('Profile picture updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload profile picture');
    } finally {
      setUploadingPic(false);
    }
  };

  const handlePasswordReset = () => {
    toast.info('Password reset is managed through Internet Identity. Please visit your Internet Identity settings.');
  };

  const handleLoadTargetRole = async () => {
    if (!targetPrincipal.trim()) {
      toast.error('Please enter a valid principal ID');
      return;
    }

    try {
      setLoadingTargetRole(true);
      const principal = Principal.fromText(targetPrincipal);
      const role = await getUserRole.mutateAsync(principal);
      setTargetRole(role);
      toast.success('User role loaded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to load user role');
      setTargetRole(null);
    } finally {
      setLoadingTargetRole(false);
    }
  };

  const handleAssignRole = async (newRole: UserRole) => {
    if (!targetPrincipal.trim()) {
      toast.error('Please enter a valid principal ID');
      return;
    }

    try {
      const principal = Principal.fromText(targetPrincipal);
      await assignRole.mutateAsync({ user: principal, role: newRole });
      setTargetRole(newRole);
      toast.success('Role updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (profileLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </DialogTitle>
            <DialogDescription>
              Manage your personal information and account settings
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              {isAdmin && <TabsTrigger value="roles">Role Management</TabsTrigger>}
            </TabsList>

            <TabsContent value="personal" className="space-y-6 pt-4">
              {/* Profile Picture */}
              <div className="flex flex-col items-center gap-4">
                <Avatar 
                  className="h-24 w-24 cursor-pointer hover:opacity-80 transition-opacity" 
                  onClick={() => profilePicUrl && setProfilePicModalOpen(true)}
                >
                  {profilePicUrl ? (
                    <AvatarImage src={profilePicUrl} alt={name} />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {getInitials(name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex flex-col items-center gap-2">
                  <Label htmlFor="profile-pic" className="cursor-pointer">
                    <Button variant="outline" size="sm" disabled={uploadingPic} asChild>
                      <span>
                        {uploadingPic ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Picture
                          </>
                        )}
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id="profile-pic"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePicUpload}
                    disabled={uploadingPic}
                  />
                  {profilePicUrl && (
                    <p className="text-xs text-muted-foreground">
                      Click picture to view full size
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Personal Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Principal ID</Label>
                  <Input
                    value={identity?.getPrincipal().toString() || ''}
                    disabled
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your unique Internet Identity principal
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={saveProfile.isPending}>
                  {saveProfile.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-6 pt-4">
              <div className="rounded-lg border bg-card p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Key className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold">Password & Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Your account is secured with Internet Identity, a secure authentication system
                      that doesn't use traditional passwords. To manage your authentication settings,
                      visit your Internet Identity dashboard.
                    </p>
                    <Button variant="outline" onClick={handlePasswordReset} className="mt-2">
                      Manage Internet Identity
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="roles" className="space-y-6 pt-4">
                <div className="rounded-lg border bg-card p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="font-semibold">User Role Management</h3>
                        <p className="text-sm text-muted-foreground">
                          View and modify user roles for any user in the system
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="target-principal">User Principal ID</Label>
                          <div className="flex gap-2">
                            <Input
                              id="target-principal"
                              value={targetPrincipal}
                              onChange={(e) => setTargetPrincipal(e.target.value)}
                              placeholder="Enter principal ID"
                              className="font-mono text-xs"
                            />
                            <Button
                              onClick={handleLoadTargetRole}
                              disabled={loadingTargetRole || !targetPrincipal.trim()}
                            >
                              {loadingTargetRole ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Load'
                              )}
                            </Button>
                          </div>
                        </div>

                        {targetRole !== null && (
                          <div className="space-y-2">
                            <Label>Current Role</Label>
                            <div className="flex items-center gap-2">
                              <Select
                                value={targetRole}
                                onValueChange={(value) => handleAssignRole(value as UserRole)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={UserRole.admin}>Admin</SelectItem>
                                  <SelectItem value={UserRole.user}>User (Trainer/Member)</SelectItem>
                                  <SelectItem value={UserRole.guest}>Guest</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Note: Users with "User" role can be either Trainers or Members based on their assignments
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Profile Picture Modal */}
      {profilePicUrl && (
        <ProfilePictureModal
          open={profilePicModalOpen}
          onOpenChange={setProfilePicModalOpen}
          imageUrl={profilePicUrl}
          altText={name}
        />
      )}
    </>
  );
}
