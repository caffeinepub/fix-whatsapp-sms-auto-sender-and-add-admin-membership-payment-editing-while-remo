# Specification

## Summary
**Goal:** Allow admin-created members to log in using real email/password credentials and access the member portal without requiring Internet Identity.

**Planned changes:**
- Implement backend email/password authentication for the existing `memberLogin(email, password)` flow, returning the logged-in member profile in the format expected by the frontend.
- Ensure invalid login attempts return a deterministic error message containing "Invalid credentials provided".
- Update backend member creation via `addMemberWithManualCredentials` to persist credentials, enforce unique emails, and associate credentials with the created member.
- Remove stored credentials when a member is deleted so deleted members can no longer log in.
- Enable member dashboard/backend member-portal operations to work for email/password-authenticated members (without Internet Identity), while preventing access to other members’ data.
- Preserve current admin authentication/authorization requirements using Internet Identity (no weakening of admin-only permissions).

**User-visible outcome:** Members created by an admin can log in from the existing Member Login form with their email/password, and then load and use the Member Dashboard/portal features without needing Internet Identity.
