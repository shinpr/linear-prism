---
name: recipe-decompose
description: Decomposes Linear issues or requirement documents into the fewest implementation-ready value units, then registers the approved tasks in Linear. Use when "decompose", "break down tasks", "split into tasks", "task breakdown", or "create Linear issues from requirements".
disable-model-invocation: true
---

# Orchestrator Definition

I am an orchestrator. I invoke a sub-agent for requirement analysis and decomposition, resolve the interaction from its evidence, and coordinate Linear registration. All Linear MCP operations are executed directly by the orchestrator. See `references/register.md` for the registration procedure.

**Sub-agent**: `linear-prism:task-decomposer-linear`

# Input

`$ARGUMENTS` contains one of:
- A Linear issue URL (e.g., `https://linear.app/team/issue/ENG-123`)
- A file path to a PRD or requirement document
- Empty (ask the user which input to use)

# Prerequisites

- Linear MCP connection is active. Verify it before starting; if unavailable, report the missing dependency and stop.

# Workflow Overview

```
Round 1: Fetch input → Analyze outcome and scope → Continue or ask for a blocking user decision
Round 2: Propose decomposition strategy → Present task list → User adjusts
Round 3: Explicit approval of the current valid task list → Register in Linear
```

Detailed procedures for each round are in the `references/` directory:
- **Round 1**: See `references/analyze.md`
- **Round 2**: See `references/plan.md`
- **Round 3**: See `references/register.md`

# Scope Boundaries

**In scope**:
- Fetching and analyzing requirement content from Linear or local files.
- Resolving repository-local ambiguity from evidence and requesting only user-owned outcome or scope decisions.
- Decomposing requirements into typed tasks with dependency graphs.
- Registering tasks as Linear issues.

**Out of scope**:
- Modifying the source PRD or Linear issue directly.
- Generating Design Documents or Work Plans (downstream responsibility).
- Implementing any task produced by this skill.

# Error Handling

| Condition | Action |
|-----------|--------|
| Linear MCP unavailable | Report the missing required dependency and stop |
| Input URL returns empty or inaccessible content | Present the error, ask user for alternative input |
| Agent returns `recommended_action: needs_input` | Ask only the returned user-owned questions, then re-analyze |
| User rejects task list in Round 2 | Collect adjustment instructions, re-invoke agent in `revise` mode (see `references/plan.md`) |

# Completion Criteria

- [ ] Every current in-scope desired behavior from the input maps to at least one task.
- [ ] Every shared prerequisite is required before the earliest dependent value unit can complete and verify its outcome.
- [ ] Each task has explicit service responsibility scopes.
- [ ] Dependency edges represent real execution or verification blockers.
- [ ] The exact task list approved by the user is registered in Linear.
