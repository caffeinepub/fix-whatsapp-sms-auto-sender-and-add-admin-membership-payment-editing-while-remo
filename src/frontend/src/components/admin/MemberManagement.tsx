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
import { Plus, Edit, Trash2, QrCode, Loader2, Search, ChevronLeft, ChevronRight, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import QRCodeDialog from '../QRCodeDialog';
import ProfilePictureModal from '../ProfilePictureModal';
import CommunicationSimulation from './CommunicationSimulation';
import { Separator } from '@/components/ui/separator';

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
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      toast.error('Please fill in all required fields including email and password');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Basic password validation
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
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
      toast.error('Please select or create a membership plan');
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
        toast.error('Failed to process profile picture');
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
      const errorMessage = error?.message || 'Failed to create member';
      toast.error(errorMessage);
      console.error(error);
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
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter member's full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
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
                      placeholder="Enter secure password (min 6 characters)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 6 characters long
                    </p>
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

                  <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-4 text-sm text-blue-900 dark:text-blue-100">
                    <strong>Manual Credentials:</strong> You are setting the email and password for this member. 
                    These credentials will be sent via Email, SMS, and WhatsApp.
                  </div>

                  <Separator />

                  {/* Membership Plan Selection */}
                  <div className="space-y-3">
                    <Label>Membership Plan *</Label>
                    {!showNewPlanForm ? (
                      <div className="space-y-2">
                        <Select
                          value={formData.selectedPlanId}
                          onValueChange={(value) => {
                            if (value === 'create_new') {
                              setShowNewPlanForm(true);
                              setFormData({ ...formData, selectedPlanId: '' });
                            } else {
                              setFormData({ ...formData, selectedPlanId: value });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a membership plan" />
                          </SelectTrigger>
                          <SelectContent>
                            {plansLoading ? (
                              <SelectItem value="loading" disabled>
                                Loading plans...
                              </SelectItem>
                            ) : (
                              <>
                                {membershipPlans.map((plan) => (
                                  <SelectItem key={plan.id} value={plan.id}>
                                    {plan.name} - ₹{Number(plan.price).toLocaleString('en-IN')} ({Number(plan.durationMonths)}{' '}
                                    months)
                                  </SelectItem>
                                ))}
                                <SelectItem value="create_new">+ Create New Plan</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        {formData.selectedPlanId && (
                          <div className="rounded-md border p-3 text-sm">
                            {(() => {
                              const plan = membershipPlans.find((p) => p.id === formData.selectedPlanId);
                              return plan ? (
                                <div className="space-y-1">
                                  <p className="font-medium">{plan.name}</p>
                                  <p className="text-muted-foreground">
                                    Duration: {Number(plan.durationMonths)} months
                                  </p>
                                  <p className="text-muted-foreground">Price: ₹{Number(plan.price).toLocaleString('en-IN')}</p>
                                  {plan.benefits && (
                                    <p className="text-muted-foreground">Benefits: {plan.benefits}</p>
                                  )}
                                </div>
                              ) : null;
                            })()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3 rounded-md border p-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">Create New Plan</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowNewPlanForm(false);
                              setNewPlanData({
                                name: '',
                                durationMonths: '',
                                price: '',
                                benefits: '',
                              });
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="plan-name">Plan Name</Label>
                          <Input
                            id="plan-name"
                            placeholder="e.g., Premium Monthly"
                            value={newPlanData.name}
                            onChange={(e) => setNewPlanData({ ...newPlanData, name: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="plan-duration">Duration (months)</Label>
                            <Input
                              id="plan-duration"
                              type="number"
                              min="1"
                              placeholder="12"
                              value={newPlanData.durationMonths}
                              onChange={(e) =>
                                setNewPlanData({ ...newPlanData, durationMonths: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="plan-price">Price (₹)</Label>
                            <Input
                              id="plan-price"
                              type="number"
                              min="0"
                              placeholder="999"
                              value={newPlanData.price}
                              onChange={(e) => setNewPlanData({ ...newPlanData, price: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="plan-benefits">Benefits Description</Label>
                          <Textarea
                            id="plan-benefits"
                            placeholder="Access to all equipment, group classes, personal training sessions..."
                            value={newPlanData.benefits}
                            onChange={(e) => setNewPlanData({ ...newPlanData, benefits: e.target.value })}
                            rows={3}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddMember} disabled={createMemberWithManualCredentials.isPending || addMembershipPlan.isPending}>
                    {createMemberWithManualCredentials.isPending || addMembershipPlan.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Member'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            {filteredMembers.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)} of {filteredMembers.length}
              </div>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {searchQuery ? 'No members found matching your search' : 'No members found'}
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
                          <span className="font-medium">{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>{member.membershipPlan.name}</TableCell>
                      <TableCell>{getStatusBadge(member.membershipStatus)}</TableCell>
                      <TableCell>
                        {new Date(Number(member.endDate) / 1000000).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setQrMember(member)}
                            title="Generate QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(member)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMember(member.id)}
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
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

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.membershipStatus}
                onValueChange={(value) =>
                  setFormData({ ...formData, membershipStatus: value as MembershipStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MembershipStatus.active}>Active</SelectItem>
                  <SelectItem value={MembershipStatus.pending}>Pending</SelectItem>
                  <SelectItem value={MembershipStatus.expired}>Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditMember} disabled={updateMember.isPending}>
              {updateMember.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Member'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog with Communication Simulation */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Member Creation Successful</DialogTitle>
            <DialogDescription>
              Review the credentials and simulated communications
            </DialogDescription>
          </DialogHeader>
          {createMemberResponse && <CommunicationSimulation response={createMemberResponse} />}
          <DialogFooter>
            <Button onClick={() => {
              setIsSuccessDialogOpen(false);
              setCreateMemberResponse(null);
            }}>
              Close
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
    </div>
  );
}
