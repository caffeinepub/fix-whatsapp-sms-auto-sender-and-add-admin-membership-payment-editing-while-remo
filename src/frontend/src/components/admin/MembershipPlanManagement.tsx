import { useState } from 'react';
import { useGetAllMembershipPlans, useUpdateMembershipPlan, useDeleteMembershipPlan } from '../../hooks/useQueries';
import { MembershipPlan } from '../../backend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MembershipPlanManagement() {
  const { data: membershipPlans = [], isLoading } = useGetAllMembershipPlans();
  const updateMembershipPlan = useUpdateMembershipPlan();
  const deleteMembershipPlan = useDeleteMembershipPlan();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);

  const [editFormData, setEditFormData] = useState({
    name: '',
    durationMonths: '',
    price: '',
    benefits: '',
  });

  const openEditDialog = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setEditFormData({
      name: plan.name,
      durationMonths: plan.durationMonths.toString(),
      price: plan.price.toString(),
      benefits: plan.benefits,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setIsDeleteDialogOpen(true);
  };

  const handleEditPlan = async () => {
    if (!selectedPlan) return;

    if (!editFormData.name || !editFormData.durationMonths || !editFormData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    const updatedPlan: MembershipPlan = {
      id: selectedPlan.id,
      name: editFormData.name,
      durationMonths: BigInt(editFormData.durationMonths),
      price: BigInt(editFormData.price),
      benefits: editFormData.benefits,
    };

    try {
      await updateMembershipPlan.mutateAsync(updatedPlan);
      toast.success('Membership plan updated successfully');
      setIsEditDialogOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      toast.error('Failed to update membership plan');
      console.error(error);
    }
  };

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;

    try {
      await deleteMembershipPlan.mutateAsync(selectedPlan.id);
      toast.success('Membership plan deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      toast.error('Failed to delete membership plan');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Membership Plans</CardTitle>
          <CardDescription>
            Manage existing membership plans - edit details or remove plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          {membershipPlans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No membership plans available. Create one when adding a new member.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Benefits</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membershipPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>{plan.durationMonths.toString()} months</TableCell>
                      <TableCell>₹{plan.price.toString()}</TableCell>
                      <TableCell className="max-w-xs truncate">{plan.benefits || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(plan)}
                            disabled={updateMembershipPlan.isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(plan)}
                            disabled={deleteMembershipPlan.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Membership Plan</DialogTitle>
            <DialogDescription>
              Update the details of this membership plan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-plan-name">Plan Name *</Label>
              <Input
                id="edit-plan-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="e.g., Gold Membership"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-duration">Duration (Months) *</Label>
              <Input
                id="edit-duration"
                type="number"
                min="1"
                value={editFormData.durationMonths}
                onChange={(e) => setEditFormData({ ...editFormData, durationMonths: e.target.value })}
                placeholder="e.g., 12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price (₹) *</Label>
              <Input
                id="edit-price"
                type="number"
                min="0"
                value={editFormData.price}
                onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                placeholder="e.g., 5000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-benefits">Benefits</Label>
              <Textarea
                id="edit-benefits"
                value={editFormData.benefits}
                onChange={(e) => setEditFormData({ ...editFormData, benefits: e.target.value })}
                placeholder="List the benefits of this plan..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPlan} disabled={updateMembershipPlan.isPending}>
              {updateMembershipPlan.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Membership Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the plan "{selectedPlan?.name}"? This action cannot be undone.
              Note: Existing members with this plan will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
              disabled={deleteMembershipPlan.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMembershipPlan.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
