# Specification

## Summary
**Goal:** When an admin creates a member with manually provided credentials, automatically generate simulated onboarding messages (Email/SMS/WhatsApp) and show them in-app as communication logs that can be copied.

**Planned changes:**
- Backend: Extend the admin member-creation flow used by `useCreateMemberWithManualCredentials` to create/persist the `MemberProfile`, store the provided credentials mapping, and return a `ManualCreateMemberResponse` containing the member, credentials, and `communicationLogs`.
- Backend: Generate exactly three communication log entries (`#email`, `#sms`, `#whatsapp`) with English content that includes login email/password, membership plan name/duration/price, and membership validity dates (or equivalent stored validity info), and mark them consistently as simulated/not-delivered (e.g., `#pending` or `#failed` with reason).
- Backend: Enforce admin-only access and reject non-admin callers; prevent partial state on errors such as non-unique email.
- Frontend: Update the Add Member success experience in `frontend/src/components/admin/MemberManagement.tsx` to render the returned `communicationLogs`, clearly labeled as simulated/not delivered, while keeping copy-to-clipboard for email/password and message content.
- Frontend: Update `frontend/src/components/admin/CommunicationSimulation.tsx` so any status label does not imply real delivery, and add a prominent English disclaimer wherever these logs appear that SMS/WhatsApp/Email delivery is not supported and messages must be copied/shared manually.

**User-visible outcome:** After an admin adds a member, the app shows simulated Email/SMS/WhatsApp onboarding messages (with credentials and plan/payment details) as in-app logs that the admin can copy, with clear disclaimers that nothing is actually sent to real devices.
