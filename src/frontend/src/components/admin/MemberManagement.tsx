import { useState, useMemo } from 'react';
import {
  useGetAllMembers,
  useUpdateMember,
  useDeleteMember,
  useGetAllMembershipPlans,
  useAddMembershipPlan,
  useCreateMemberWithManualCredentials,
} from '../../hooks/useQueries';
import { MemberProfile, MembershipStatus, MembershipPlan, ExternalBlob, ManualCreateMemberRequest, ManualCreateMemberResponse } from '../../backend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Edit, Trash2, QrCode, Loader2, Search, ChevronLeft, ChevronRight, Upload, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import QRCodeDialog from '../QRCodeDialog';
import ProfilePictureModal from '../ProfilePictureModal';
import CommunicationSimulation from './CommunicationSimulation';
import MembershipPlanManagement from './MembershipPlanManagement';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ITEMS_PER_PAGE = 20;

export default function MemberManagement() {
  const { data: members = [], isLoading } = useGetAllMembers();
  const { data: membershipPlans = [], isLoading: plansLoading } = useGetAllMembershipPlans();
  const createMemberWithManualCredentials = useCreateMemberWithManualCredentials();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();
  const addMembershipPlan = useAddMembershipPlan();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);
  const [createMemberResponse, setCreateMemberResponse] = useState<ManualCreateMemberResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [qrMember, setQrMember] = useState<MemberProfile | null>(null);
  const [showNewPlanForm, setShowNewPlanForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [profilePicModalOpen, setProfilePicModalOpen] = useState(false);
  const [profilePicModalUrl, setProfilePicModalUrl] = useState('');
  const [profilePicModalAlt, setProfilePicModalAlt] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    membershipStatus: MembershipStatus.active,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    selectedPlanId: '',
  });

  const [newPlanData, setNewPlanData] = useState({
    name: '',
    durationMonths: '',
    price: '',
    benefits: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      membershipStatus: MembershipStatus.active,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      selectedPlanId: '',
    });
    setShowNewPlanForm(false);
    setNewPlanData({
      name: '',
      durationMonths: '',
      price: '',
      benefits: '',
    });
    setProfilePicFile(null);
    setProfilePicPreview(null);
    setUploadProgress(0);
    setCreateError(null);
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setProfilePicFile(file);
      
      // Create immediate preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearProfilePic = () => {
    setProfilePicFile(null);
    setProfilePicPreview(null);
    setUploadProgress(0);
  };

  const openProfilePicModal = (imageUrl: string, name: string) => {
    setProfilePicModalUrl(imageUrl);
    setProfilePicModalAlt(name);
    setProfilePicModalOpen(true);
  };

  const handleCreateNewPlan = async () => {
    if (!newPlanData.name || !newPlanData.durationMonths || !newPlanData.price) {
      toast.error('Please fill in all plan fields');
      return null;
    }

    const plan: MembershipPlan = {
      id: `plan_${Date.now()}`,
      name: newPlanData.name,
      durationMonths: BigInt(newPlanData.durationMonths),
      price: BigInt(newPlanData.price),
      benefits: newPlanData.benefits,
    };

    try {
      await addMembershipPlan.mutateAsync(plan);
      toast.success('Membership plan created successfully');
      return plan;
    } catch (error) {
      toast.error('Failed to create membership plan');
      console.error(error);
      return null;
    }
  };

  const handleAddMember = async () => {
    // Clear previous error
    setCreateError(null);

    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      setCreateError('Please fill in all required fields including email and password');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setCreateError('Please enter a valid email address');
      return;
    }

    // Basic password validation
    if (formData.password.length < 6) {
      setCreateError('Password must be at least 6 characters long');
      return;
    }

    let selectedPlan: MembershipPlan | null = null;

    if (showNewPlanForm) {
      selectedPlan = await handleCreateNewPlan();
      if (!selectedPlan) return;
    } else if (formData.selectedPlanId) {
      selectedPlan = membershipPlans.find((p) => p.id === formData.selectedPlanId) || null;
    }

    if (!selectedPlan) {
      setCreateError('Please select or create a membership plan');
      return;
    }

    // Handle profile picture upload
    let profilePicBlob: ExternalBlob | undefined = undefined;
    if (profilePicFile) {
      try {
        const arrayBuffer = await profilePicFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        profilePicBlob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });
      } catch (error) {
        setCreateError('Failed to process profile picture');
        console.error(error);
        return;
      }
    }

    const request: ManualCreateMemberRequest = {
      name: formData.name,
      credentials: {
        email: formData.email,
        password: formData.password,
      },
      phone: formData.phone,
      membershipPlan: selectedPlan,
      profilePic: profilePicBlob,
    };

    try {
      const response = await createMemberWithManualCredentials.mutateAsync(request);
      setCreateMemberResponse(response);
      toast.success('Member created successfully with provided credentials');
      setIsAddDialogOpen(false);
      setIsSuccessDialogOpen(true);
      resetForm();
    } catch (error: any) {
      // Extract user-friendly error message
      let errorMessage = 'Failed to create member';
      
      if (error?.message) {
        const msg = error.message;
        if (msg.includes('Email already exists')) {
          errorMessage = 'This email address is already registered in the system. Please use a different email.';
        } else if (msg.includes('Password cannot be empty')) {
          errorMessage = 'Password is required and cannot be empty.';
        } else if (msg.includes('Unauthorized')) {
          errorMessage = 'You do not have permission to create members.';
        } else {
          errorMessage = msg;
        }
      }
      
      setCreateError(errorMessage);
      console.error('Member creation error:', error);
    }
  };

  const handleEditMember = async () => {
    if (!selectedMember) return;

    // Handle profile picture upload if changed
    let profilePicBlob: ExternalBlob | undefined = selectedMember.profilePic;
    if (profilePicFile) {
      try {
        const arrayBuffer = await profilePicFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        profilePicBlob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });
      } catch (error) {
        toast.error('Failed to process profile picture');
        console.error(error);
        return;
      }
    }

    const updatedMember: MemberProfile = {
      ...selectedMember,
      name: formData.name,
      phone: formData.phone,
      membershipStatus: formData.membershipStatus,
      startDate: BigInt(new Date(formData.startDate).getTime() * 1000000),
      endDate: BigInt(new Date(formData.endDate).getTime() * 1000000),
      profilePic: profilePicBlob,
    };

    try {
      await updateMember.mutateAsync({ id: selectedMember.id, member: updatedMember });
      toast.success('Member updated successfully');
      setIsEditDialogOpen(false);
      setSelectedMember(null);
      resetForm();
    } catch (error) {
      toast.error('Failed to update member');
      console.error(error);
    }
  };

  const handleDeleteMember = async (id: bigint) => {
    if (!confirm('Are you sure you want to delete this member?')) return;

    try {
      await deleteMember.mutateAsync(id);
      toast.success('Member deleted successfully');
    } catch (error) {
      toast.error('Failed to delete member');
      console.error(error);
    }
  };

  const openEditDialog = (member: MemberProfile) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      password: '',
      phone: member.phone,
      membershipStatus: member.membershipStatus,
      startDate: new Date(Number(member.startDate) / 1000000).toISOString().split('T')[0],
      endDate: new Date(Number(member.endDate) / 1000000).toISOString().split('T')[0],
      selectedPlanId: member.membershipPlan.id,
    });
    // Set existing profile picture preview
    if (member.profilePic) {
      setProfilePicPreview(member.profilePic.getDirectURL());
    } else {
      setProfilePicPreview(null);
    }
    setProfilePicFile(null);
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: MembershipStatus) => {
    switch (status) {
      case MembershipStatus.active:
        return <Badge className="bg-green-500">Active</Badge>;
      case MembershipStatus.expired:
        return <Badge variant="destructive">Expired</Badge>;
      case MembershipStatus.pending:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getMemberInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Memoized filtered and paginated members for performance
  const { filteredMembers, paginatedMembers, totalPages } = useMemo(() => {
    const filtered = members.filter(
      (member) =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const total = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      filteredMembers: filtered,
      paginatedMembers: paginated,
      totalPages: total,
    };
  }, [members, searchQuery, currentPage]);

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const activeCount = members.filter((m) => m.membershipStatus === MembershipStatus.active).length;
  const expiredCount = members.filter((m) => m.membershipStatus === MembershipStatus.expired).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Members</CardDescription>
            <CardTitle className="text-3xl">{members.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Members</CardDescription>
            <CardTitle className="text-3xl text-green-600">{activeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Expired Memberships</CardDescription>
            <CardTitle className="text-3xl text-destructive">{expiredCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Membership Plan Management Section */}
      <MembershipPlanManagement />

      {/* Members Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                Manage gym member profiles with manual credential entry - Unlimited member capacity
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) {
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Member</DialogTitle>
                  <DialogDescription>
                    Enter member details including email and password credentials
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Error Alert */}
                  {createError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{createError}</AlertDescription>
                    </Alert>
                  )}

                  {/* Profile Picture Upload */}
                  <div className="space-y-2">
                    <Label>Profile Picture</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => profilePicPreview && openProfilePicModal(profilePicPreview, formData.name)}>
                        {profilePicPreview ? (
                          <AvatarImage src={profilePicPreview} alt="Profile preview" />
                        ) : (
                          <AvatarFallback className="text-lg">
                            {formData.name ? getMemberInitials(formData.name) : <Upload className="h-8 w-8" />}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('profile-pic-upload')?.click()}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {profilePicPreview ? 'Change Image' : 'Upload Image'}
                          </Button>
                          {profilePicPreview && (
                            <Button type="button" variant="ghost" size="sm" onClick={clearProfilePic}>
                              <X className="mr-2 h-4 w-4" />
                              Remove
                            </Button>
                          )}
                        </div>
                        <Input
                          id="profile-pic-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfilePicChange}
                        />
                        <p className="text-xs text-muted-foreground">
                          Recommended: Square image, max 5MB. Click to view full size.
                        </p>
                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div className="text-xs text-muted-foreground">
                            Uploading: {uploadProgress}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter member name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="member@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Membership Plan *</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={showNewPlanForm ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowNewPlanForm(true)}
                      >
                        Create New Plan
                      </Button>
                      <Button
                        type="button"
                        variant={!showNewPlanForm ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowNewPlanForm(false)}
                        disabled={membershipPlans.length === 0}
                      >
                        Select Existing Plan
                      </Button>
                    </div>
                  </div>

                  {showNewPlanForm ? (
                    <div className="space-y-4 rounded-lg border p-4">
                      <div className="space-y-2">
                        <Label htmlFor="plan-name">Plan Name *</Label>
                        <Input
                          id="plan-name"
                          value={newPlanData.name}
                          onChange={(e) => setNewPlanData({ ...newPlanData, name: e.target.value })}
                          placeholder="e.g., Gold Membership"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (Months) *</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="1"
                          value={newPlanData.durationMonths}
                          onChange={(e) => setNewPlanData({ ...newPlanData, durationMonths: e.target.value })}
                          placeholder="e.g., 12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (₹) *</Label>
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          value={newPlanData.price}
                          onChange={(e) => setNewPlanData({ ...newPlanData, price: e.target.value })}
                          placeholder="e.g., 5000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="benefits">Benefits</Label>
                        <Textarea
                          id="benefits"
                          value={newPlanData.benefits}
                          onChange={(e) => setNewPlanData({ ...newPlanData, benefits: e.target.value })}
                          placeholder="List the benefits of this plan..."
                          rows={3}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="select-plan">Select Plan *</Label>
                      <Select value={formData.selectedPlanId} onValueChange={(value) => setFormData({ ...formData, selectedPlanId: value })}>
                        <SelectTrigger id="select-plan">
                          <SelectValue placeholder="Choose a membership plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {membershipPlans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name} - {plan.durationMonths.toString()} months - ₹{plan.price.toString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddMember} disabled={createMemberWithManualCredentials.isPending}>
                    {createMemberWithManualCredentials.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Member
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search Bar */}
          <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {searchQuery ? 'No members found matching your search' : 'No members yet. Add your first member!'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedMembers.map((member) => (
                    <TableRow key={member.id.toString()}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar 
                            className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => member.profilePic && openProfilePicModal(member.profilePic.getDirectURL(), member.name)}
                          >
                            {member.profilePic ? (
                              <AvatarImage src={member.profilePic.getDirectURL()} alt={member.name} />
                            ) : (
                              <AvatarFallback>{getMemberInitials(member.name)}</AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-muted-foreground">ID: {member.id.toString()}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>{getStatusBadge(member.membershipStatus)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{member.membershipPlan.name}</div>
                          <div className="text-muted-foreground">₹{member.membershipPlan.price.toString()}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setQrMember(member)}>
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(member)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMember(member.id)}
                            disabled={deleteMember.isPending}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)} of {filteredMembers.length} members
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="text-sm">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>Update member information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Profile Picture Upload */}
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => profilePicPreview && openProfilePicModal(profilePicPreview, formData.name)}>
                  {profilePicPreview ? (
                    <AvatarImage src={profilePicPreview} alt="Profile preview" />
                  ) : (
                    <AvatarFallback className="text-lg">
                      {formData.name ? getMemberInitials(formData.name) : <Upload className="h-8 w-8" />}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('edit-profile-pic-upload')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {profilePicPreview ? 'Change Image' : 'Upload Image'}
                    </Button>
                    {profilePicPreview && (
                      <Button type="button" variant="ghost" size="sm" onClick={clearProfilePic}>
                        <X className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <Input
                    id="edit-profile-pic-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePicChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: Square image, max 5MB. Click to view full size.
                  </p>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="text-xs text-muted-foreground">
                      Uploading: {uploadProgress}%
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email (Read-only)</Label>
              <Input id="edit-email" value={formData.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.membershipStatus}
                onValueChange={(value) => setFormData({ ...formData, membershipStatus: value as MembershipStatus })}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MembershipStatus.active}>Active</SelectItem>
                  <SelectItem value={MembershipStatus.expired}>Expired</SelectItem>
                  <SelectItem value={MembershipStatus.pending}>Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start-date">Start Date</Label>
                <Input
                  id="edit-start-date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end-date">End Date</Label>
                <Input
                  id="edit-end-date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditMember} disabled={updateMember.isPending}>
              {updateMember.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      {qrMember && <QRCodeDialog member={qrMember} onClose={() => setQrMember(null)} />}

      {/* Profile Picture Modal */}
      <ProfilePictureModal
        open={profilePicModalOpen}
        onOpenChange={setProfilePicModalOpen}
        imageUrl={profilePicModalUrl}
        altText={profilePicModalAlt}
      />

      {/* Success Dialog with Communication Simulation */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Member Created Successfully</DialogTitle>
            <DialogDescription>
              The member has been created with the provided credentials. Below are the simulated communication logs.
            </DialogDescription>
          </DialogHeader>
          {createMemberResponse && (
            <CommunicationSimulation response={createMemberResponse} />
          )}
          <DialogFooter>
            <Button onClick={() => setIsSuccessDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
