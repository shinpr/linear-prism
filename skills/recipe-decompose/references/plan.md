# Round 2: Decomposition and Review

## Step 1: Invoke Decomposition

Invoke the task-decomposer-linear agent in `decompose` mode:

```
subagent_type: linear-prism:task-decomposer-linear
description: "Decompose into tasks"
prompt: |
  mode: decompose
  input_type: $INPUT_TYPE
  source: |
    $INPUT_CONTENT
  context: |
    Analysis: $ANALYSIS
    Clarifications: $CLARIFICATIONS
```

Store the result as `$DECOMPOSITION`.

## Step 2: Present Task List

Present the decomposition as plain text. Structure the presentation:

### Strategy Summary

State the selected slicing strategy (Vertical / Horizontal / Hybrid) and the reason in one sentence.

### Task Table

Display tasks in dependency order as a numbered list:

```
T1 [shared_prerequisite] — Title
   Goal: observable condition that proves completion
   Services: service-a, service-b
   Service Scopes: service-a (scope), service-b (scope)
   Depends on: (none)

T2 [value_unit] — Title
   Goal: observable condition that proves completion
   Services: service-a
   Service Scopes: service-a (scope)
   Depends on: T1
   Notes: Requires shared contract from T1
```

### Dependency Graph

Display as a text-based graph:

```
T1 → T2 (shared contract prerequisite)
T1 → T3 (shared contract prerequisite)
T3 → T4 (data dependency)
```

### Coverage Check

Using the `source_requirements` and `coverage_map` from the decomposition result:

- List each current in-scope desired behavior and which tasks cover it.
- Flag any requirement where `covered_by` is empty.
- State: "X/Y requirements covered. Z shared prerequisites extracted."
- If assumptions were made, list them under "Assumptions".

## Step 3: Collect User Feedback

Ask via AskUserQuestion: "Review the current task breakdown. Approve it for Linear registration, or describe the outcome you want changed."

## Step 4: Handle Response

### If `approve`:
Record `$FINAL_TASKS` = `$DECOMPOSITION` and proceed to Round 3.

### If the user requests a change:
Invoke the task-decomposer-linear agent in `revise` mode:

```
subagent_type: linear-prism:task-decomposer-linear
description: "Revise task list"
prompt: |
  mode: revise
  source: |
    $DECOMPOSITION
  context: |
    User adjustment instructions: [user's feedback]
```

Store the result as `$REVISION`.

If `$REVISION.status` is `ok`:
- Replace `$DECOMPOSITION` with `$REVISION`.
- Present the updated task list and return to Step 3.

If `$REVISION.status` is `needs_user_decision`:
- Preserve the returned task list as the current state.
- Present each conflicting adjustment with the exact requirement or invariant it conflicts with.
- Ask only for the decision required to resolve or withdraw that adjustment.
- Re-invoke `revise` only after the user supplies new information that can change the conflict.

When a repeated instruction produces the same conflict with no new evidence, report the unchanged conflict and wait. Repetition never authorizes progression. Only an explicit `approve` response for the current valid task list sets `$FINAL_TASKS`.

## Step 5: Transition to Round 3

Collected data for Round 3:
- `$FINAL_TASKS`: approved task list with dependency graph
- `$INPUT_TYPE`: `file` or `linear_issue` (from Round 1)
- `$SOURCE_ISSUE_ID`: source issue identifier (only when `$INPUT_TYPE` is `linear_issue`)
- `$INPUT_CONTENT`: original requirement (for Linear issue descriptions)
- `$ANALYSIS`: original analysis (for project context)
