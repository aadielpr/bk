# Broiler Farm Management App

Canonical feature spec: https://github.com/aadielpr/bk/issues/1

## Problem Statement

The current Excel log records a Production Cycle in a single wide sheet. Owners and Operators need a more organized way to manage multiple farms and coops, start Production Cycles, submit daily records, and understand flock performance. The spreadsheet makes it difficult to scope access by farm and coop, keep a reliable correction history, and use different feed standards and IP calculations for each DOC Supplier (PT).

## Solution

Build an online broiler farm management app around Broiler Farms, coops, Production Cycles, and versioned Daily Reports. Farm Owners manage Production Cycles and see all coops in their farms. Operators record activity only for coops assigned to them. A separate Super Admin account manages versioned PT Templates and has app-wide access.

The primary work surface is a whole-day report for one coop and date. Each submitted correction creates a new Daily Report Version containing the complete day, while keeping earlier versions available to Owners and the Super Admin. Dashboards summarize the current Production Cycle and link to its Daily Reports and history.

## User Stories

1. As a farm Owner, I want to manage more than one Broiler Farm, so that I can oversee all farms associated with my account.
2. As a farm Owner, I want to see every coop in each farm I belong to, so that I can oversee all of that farm's Production Cycles.
3. As an Operator, I want access limited to the coops assigned to me in each farm, so that I only record and view work I am responsible for.
4. As a farm user, I want my account to be either an Owner account or an Operator account, so that responsibilities and access rules stay distinct.
5. As a farm Owner, I want Operators' coop access to be configurable, so that each Operator can work across the farms and coops assigned to them.
6. As the Super Admin, I want app-wide access through a separate Super Admin account, so that I can manage PT Templates and support all farms without using a farm Owner or Operator account.
7. As a farm Owner, I want to create multiple coops within a Broiler Farm, so that each physical chicken house can be managed independently.
8. As a farm Owner, I want to start a Production Cycle for one coop by entering its DOC placement date, initial DOC count, and DOC Supplier (PT), so that the flock's records begin with the correct setup.
9. As a farm Owner, I want a Production Cycle to use one PT Template Version, so that its feed types, performance targets, and IP calculation match its DOC Supplier.
10. As a farm Owner, I want the placement date to count as Day Age 1, so that daily records use the same age convention as the farm log.
11. As a farm Owner, I want each Production Cycle to manage one Flock in one coop, so that flock counts and performance remain tied to a clear place and period.
12. As a farm Owner, I want to start a new Production Cycle after the previous one closes, so that a coop can be reused without mixing flock records.
13. As a farm Owner, I want the app to prevent more than one active Production Cycle in a coop, so that daily work cannot be attributed to two flocks at once.
14. As a farm Owner, I want to close a Production Cycle only after all birds are accounted for, so that the final flock count reconciles with mortality, sorting, and harvest records.
15. As a farm Owner or assigned Operator, I want one Daily Report for each active-cycle coop and date, so that the work is organized by the coop being managed rather than only by farm.
16. As an assigned Operator, I want to record the day's feed consumption by Feed Type in 50 kg sacks, so that actual Feed Intake can be compared with the PT Template's targets.
17. As an assigned Operator, I want to record mortality, sorting, notes, and body-weight samples when taken, so that the flock's daily condition and measurements are available in one report.
18. As an assigned Operator, I want to record feed deliveries as separate entries by Feed Type, so that each delivery is traceable and updates the coop's Feed Stock.
19. As a farm Owner or assigned Operator, I want to see Feed Stock by coop and Feed Type, with deliveries increasing it and recorded consumption reducing it, so that I can understand the feed remaining for each flock.
20. As a farm Owner or assigned Operator, I want to record harvests and their Delivery Order (DO) counts and tonnage as separate entries for the report date, so that partial harvests are recorded without losing the day's other information.
21. As a farm Owner or assigned Operator, I want the Daily Report to support optional OVK entries, so that medication and health supplies can be recorded when the farm is ready to use that workflow.
22. As an assigned Operator, I want to save an unsubmitted Daily Report as an editable draft, so that I can finish entering the day's information before submitting it.
23. As an assigned Operator, I want to submit the complete Daily Report for a date, so that the farm has a clear record of that coop's day.
24. As an assigned Operator, I want to correct a submitted Daily Report by submitting a new full-day version, so that the latest report is accurate while the previous submission remains available.
25. As a farm Owner or the Super Admin, I want to review all Daily Report Versions, so that I can understand what was originally submitted and how it changed.
26. As an Operator, I want the latest Daily Report Version to be the one shown as current, so that I can work from the corrected report without managing version history.
27. As a farm Owner or the Super Admin, I want to correct Daily Reports after a Production Cycle closes, so that late corrections do not require reopening the flock for daily work.
28. As a farm Owner or assigned Operator, I want zero activity to be recorded distinctly from a missing Daily Report, so that the dashboard can show whether the day was reported.
29. As a farm Owner, I want to see a dashboard of active Production Cycles across my farms, so that I can identify which coops need attention.
30. As an assigned Operator, I want a dashboard limited to my assigned coops, so that I can focus on the flocks I manage.
31. As a farm Owner or assigned Operator, I want each coop's dashboard to show Day Age, remaining birds, mortality, feed used and Feed Stock, latest body weight, FCR, IP, and tonnage, so that I can understand current flock performance.
32. As a farm Owner or assigned Operator, I want to open a coop's Daily Reports from its dashboard, so that I can inspect the records behind its current metrics.
33. As the Super Admin, I want to create and maintain PT Templates containing a DOC Supplier, Feed Types, performance targets, and the supplier's IP calculation, so that farms can use the right standard for each Production Cycle.
34. As the Super Admin, I want PT Templates to have versions, so that a new standard does not silently change every existing Production Cycle.
35. As the Super Admin, I want to apply a newer PT Template Version to one selected Production Cycle, so that the intended cycle can use updated standards while other cycles retain their selected versions.
36. As a farm Owner or assigned Operator, I want FCR to be calculated from total feed consumed in kilograms and total live harvest weight, so that the metric has a consistent meaning across cycles.
37. As a farm Owner or assigned Operator, I want IP to use the calculation in the Production Cycle's selected PT Template Version, so that performance reflects the DOC Supplier's standard.
38. As a farm user, I want the app interface in Indonesian, so that daily farm work is clear to local users.
39. As an app maintainer, I want backend and database terminology in English, so that the system's internal language stays consistent with its domain documentation.
40. As the Super Admin, I want to provision each user with exactly one role, so that only trusted users can access this private app as an Owner or Operator.

## Implementation Decisions

- The core hierarchy is Broiler Farm → coop → Production Cycle → Flock and Daily Reports. A Production Cycle belongs to exactly one coop and one Flock; a coop has at most one active Production Cycle.
- Owner, Operator, and Super Admin are separate account types. A farm account cannot be both Owner and Operator. Owners have access to every coop in their farms; Operators have access only to explicitly assigned coops in each farm; the Super Admin has app-wide access and manages PT Templates.
- The app is private, with no public self-registration. The Super Admin provisions farm users and assigns each one either the Owner or Operator role.
- Only an Owner can start or close a Production Cycle. The start workflow records the coop, placement date, initial DOC count, and selected DOC Supplier/PT Template Version. The cycle's Day Age begins at Day 1 on placement day.
- A Production Cycle uses one selected PT Template Version at a time. A Super Admin can apply a newer version to one selected cycle; other cycles keep their own selected versions. Actual Daily Report submissions remain unchanged when a template version changes; PT-based targets and calculations use the version currently selected by that cycle.
- PT Templates are managed in the app by the Super Admin. They define supplier-specific Feed Types and names, performance targets, and the IP calculation. OVK is not part of a PT Template.
- A Daily Report is scoped to one coop, active Production Cycle, and date. Its submitted version is a snapshot of the whole day, including routine fields and that date's feed delivery, optional OVK, and harvest/DO entries. Draft edits before submission do not create a submitted version; each submitted correction appends a complete new version.
- The latest submitted Daily Report Version is current. Owners and the Super Admin can review all submitted versions; Operators see the latest version. Operators may correct reports for their assigned coops. Owners and the Super Admin may correct reports after cycle closure.
- Daily Report routine data includes feed consumed by Feed Type in 50 kg sacks, mortality, sorting, notes, and body-weight samples when taken. Feed deliveries, OVK use, and harvest/DO details are repeatable entries associated with the report date.
- Feed Stock is tracked by coop and Feed Type. Deliveries increase stock and recorded consumption reduces it. FCR is total consumed feed weight in kilograms divided by live harvest weight in kilograms. IP follows the formula in the cycle's selected PT Template Version.
- Dashboards are scoped by the viewer's farm and coop access. They summarize active Production Cycles and provide drill-down to Daily Reports. The initial metric set is Day Age, remaining birds, mortality, feed used and Feed Stock, latest body weight, FCR, IP, and tonnage.
- The product is online-only for the initial scope. The user interface is Indonesian; backend and database naming is English.

## Testing Decisions

- Tests should exercise behavior at the highest user-facing application boundary available, without coupling to internal component or database structure.
- The primary workflow seam is: an Owner starts a Production Cycle, an assigned Operator submits and corrects a whole-day Daily Report, and the Owner reviews the dashboard and version history.
- Focused behavior checks should cover Owner, Operator, and Super Admin access boundaries; one-active-cycle-per-coop and cycle closure reconciliation; template-version selection and cycle-specific application; explicit zero versus missing report; feed stock changes; and PT-based FCR/IP outputs.
- The repository has no application modules or existing tests yet. The modules and exact test harness should be selected when implementation structure is established. There is no test prior art in this repository to follow.

## Out of Scope

- Offline data entry or synchronization. Farms can use paper records when internet access is unavailable.
- Cycle-summary export and sharing; this can be considered in a later phase.
- A required OVK workflow. OVK is an optional form in this scope.
- Choosing a frontend framework, backend framework, database, or deployment platform.
- Reproducing the Excel sheet's wide layout as the app's information architecture.
- Public self-registration for new accounts.

## Further Notes

- The existing workbook is the source for the initial domain vocabulary and operational fields. The user reviewed a versioning prototype and chose whole-day Daily Report snapshots.
- The rule that applying a new PT Template Version recalculates PT-based targets and calculations for that selected cycle follows the user's request that a template update affect only the selected current cycle. Recorded report actuals and prior Daily Report Versions remain intact.
- Exact PT Template seed data and the formulas/targets for each supplier must be supplied or configured by the Super Admin; the product requirements define where they are used, not the numerical standards.
- The Super Admin provisions users and selects their role. The exact screen flow for farm membership and coop assignment has not yet been designed.
