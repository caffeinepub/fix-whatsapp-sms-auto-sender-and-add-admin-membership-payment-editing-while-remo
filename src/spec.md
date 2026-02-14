# Specification

## Summary
**Goal:** Correct the Money Due calculation in Admin Reports > Member Financial Overview so it reflects each member’s true outstanding balance.

**Planned changes:**
- Update the backend Reports data generation so `ReportMember.moneyDue` is calculated as: current membership plan price minus the sum of that member’s relevant payments.
- Ensure Money Due is clamped to a minimum of 0 when payments meet/exceed the plan price.
- Ensure payments are matched to the correct member using the backend’s supported identifier approach (email/phone/principal), so payments recorded via email/phone are included.
- Keep `ReportSummary.members[].moneyDue` consistent with what the Reports UI displays and ensure Reports continues to load for approved admins.

**User-visible outcome:** Admins see correct per-member Money Due values in Member Financial Overview, reflecting outstanding balance based on plan price and total matched payments (never negative).
