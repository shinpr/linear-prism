---
name: recipe-decompose
description: Decomposes Linear issues or PRD documents into implementation-ready tasks through interactive dialog, then registers them in Linear. Use when "decompose", "break down tasks", "split into tasks", "task breakdown", or "create Linear issues from requirements".
disable-model-invocation: true
---

# Orchestrator Definition

I am an orchestrator. I invoke sub-agents to perform analysis and decomposition. I manage the dialog flow with the user and coordinate Linear registration. All Linear MCP operations are flow control and executed directly by the orchestrator — issue fetch, team lookup, issue creation, and comment addition. See `references/register.md` for the full registration procedure.

**Sub-agent**: `linear-prism:task-decomposer-linear`

# Input

`$ARGUMENTS` contains one of:
- A Linear issue URL (e.g., `https://linear.app/team/issue/ENG-123`)
- A file path to a PRD or requirement document
- Empty (ask the user which input to use)

# Prerequisites

- Linear MCP connection is active (verify by listing teams or checking MCP status).
- If Linear MCP is unavailable, continue with manual-registration draft mode and inform the user.

# Workflow Overview

```
Round 1: Fetch input → Analyze quality → Present findings → User confirms or clarifies
Round 2: Propose decomposition strategy → Present task list → User adjusts
Round 3: Final task list confirmation → Register in Linear
```

Detailed procedures for each round are in the `references/` directory:
- **Round 1**: See `references/analyze.md`
- **Round 2**: See `references/plan.md`
- **Round 3**: See `references/register.md`

# Scope Boundaries

**In scope**:
- Fetching and analyzing requirement content from Linear or local files.
- Surfacing quality issues in the input and requesting user clarification.
- Decomposing requirements into typed tasks with dependency graphs.
- Registering tasks as Linear issues.

**Out of scope**:
- Modifying the source PRD or Linear issue directly.
- Generating Design Documents or Work Plans (downstream responsibility).
- Implementing any task produced by this skill.

# Error Handling

| Condition | Action |
|-----------|--------|
| Linear MCP unavailable | Inform user, switch to manual-registration draft mode, continue workflow |
| Input URL returns empty or inaccessible content | Present the error, ask user for alternative input |
| Agent returns `recommended_action: block` | Present blocking issues, ask user to resolve before retrying |
| User rejects task list in Round 2 | Collect adjustment instructions, re-invoke agent in `revise` mode (see `references/plan.md`) |

# Completion Criteria

- [ ] Every requirement from the input maps to at least one task.
- [ ] Shared prerequisites affecting 2+ later tasks are extracted as separate tasks.
- [ ] Each task has explicit Design Doc boundaries per affected service.
- [ ] Dependencies and sequencing are explicit, including cross-service order.
- [ ] Tasks are registered in Linear, or manual-registration drafts are produced.
