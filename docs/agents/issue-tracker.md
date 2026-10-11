# Issue tracker: GitHub Issues

GitHub Issues in `aadielpr/bk` are the source of truth for published specs, implementation tickets, and discussion. Use the repository's `origin` remote when confirming the target repository. `.scratch/` is for drafts, prototypes, and other supporting artifacts; it is not the issue tracker.

## Conventions

- Publish one GitHub Issue for each approved feature spec and one GitHub Issue for each implementation ticket.
- Treat the feature-spec issue as the parent context for its implementation tickets. Link tickets to it with GitHub's parent relationship when available; otherwise include its issue number and URL in a `Parent` section.
- Keep a working spec or prototype in `.scratch/<feature-slug>/` when useful, and link it from the GitHub Issue if it is relevant. The GitHub Issue remains canonical once published.
- Create implementation issues one per ticket, in dependency order. Put acceptance criteria and blocking references in each issue body; use GitHub's native issue relationships when available.
- Apply the appropriate GitHub triage label (see `triage-labels.md`). The `ready-for-agent` label is used for approved specs and agent-ready tickets.
- Read issues with `gh issue view <number> --repo aadielpr/bk`; create issues with `gh issue create --repo aadielpr/bk`. Use issue comments for discussion and updates.

Keep lasting domain language and architecture decisions in `CONTEXT.md` and ADRs. Use GitHub Issues for feature-specific requirements, implementation tickets, and their discussion.

## When a skill says "publish to the issue tracker"

Create a GitHub Issue in `aadielpr/bk` using the skill's requested body and labels. Keep any local working material under `.scratch/<feature-slug>/` and link it from the issue when useful.

## When a skill says "fetch the relevant ticket"

Use `gh issue view` to read the referenced GitHub issue. The user will normally pass an issue number or URL. If they pass a local `.scratch/` path, treat it as supporting material and check for a linked GitHub Issue before making tracker changes.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a GitHub Issue labelled `wayfinder:map`; its **child tickets** are GitHub Issues.

- **Map**: the GitHub map issue contains the `Destination`, `Notes`, `Decisions so far`, `Not yet specified`, and `Out of scope` sections.
- **Child ticket**: create a GitHub Issue labelled `wayfinder:<type>` (`research`, `prototype`, `grilling`, or `task`) with the decision question in its body. Link it from the map.
- **Blocking**: use GitHub's native issue dependency relationship when available; otherwise list blocker issue numbers and titles in a `Blocked by` section. A ticket is unblocked when every blocker is closed.
- **Frontier**: among the map's open child issues, find tickets whose blockers are closed and that have no assignee; take the first in issue order.
- **Claim**: assign the ticket to the agent or person taking it before work begins.
- **Resolve**: post the answer as an issue comment and close the ticket. Add a concise linked context pointer to the map's `Decisions so far` section.
- Keep prototypes, research notes, and other supporting artifacts in `.scratch/<effort>/` when useful, and link them from the relevant issue.
