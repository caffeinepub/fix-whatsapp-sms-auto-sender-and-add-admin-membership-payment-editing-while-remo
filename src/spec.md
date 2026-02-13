# Specification

## Summary
**Goal:** Enable admins to edit and delete existing membership plans from the Admin dashboard’s Members area.

**Planned changes:**
- Add a membership plans list section in Admin dashboard > Members (MemberManagement) alongside the existing “create new plan” flow.
- For each plan, add Edit action that opens a pre-filled form for name, durationMonths, price, and benefits, and saves via `updateMembershipPlan(plan : MembershipPlan)` with a refreshed list.
- For each plan, add Delete action with a confirmation step, deleting via `deleteMembershipPlan(id : Text)` with a refreshed list.
- Ensure backend canister interface exposed to the frontend includes `updateMembershipPlan` and `deleteMembershipPlan`, and that both remain admin-only.

**User-visible outcome:** Admins can view existing membership plans, edit plan details and save changes, or delete a plan after confirming, all in English UI text.
