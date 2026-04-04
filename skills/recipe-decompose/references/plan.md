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
   Goal: what is true after completion
   Services: service-a, service-b
   Design Docs: service-a (scope), service-b (scope)
   Depends on: (none)

T2 [value_unit] — Title
   Goal: what is true after completion
   Services: service-a
   Design Docs: service-a (scope)
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

- List each requirement and which tasks cover it.
- Flag any requirement where `covered_by` is empty.
- State: "X/Y requirements covered. Z shared prerequisites extracted."
- If assumptions were made, list them under "Assumptions".
- If `confidence` is `medium`, list `open_questions` and ask whether the user can resolve them before approving.
- If `confidence` is absent, treat as `high`.

## Step 3: Collect User Feedback

Ask via AskUserQuestion:

"Review the task breakdown above. Options:
- **approve**: Proceed to Linear registration.
- **adjust**: Describe what to change (split, merge, reorder, add, remove tasks).
- **redo**: Provide new context and regenerate the entire decomposition."

## Step 4: Handle Response

### If `approve`:
Record `$FINAL_TASKS` = `$DECOMPOSITION` and proceed to Round 3.

### If `adjust`:
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

If `$REVISION.status` is `invalid`:
- Present the validation errors and recommended fixes to the user.
- Ask: "The adjustment produced these issues. Approve the current list as-is, provide different instructions, or redo the full decomposition?"
- Handle the response as `approve`, `adjust` (new cycle), or `redo`.

Maximum 3 adjustment cycles. After the third, proceed with the current list and note unresolved issues.

### If `redo`:
Collect the new context, return to Step 1 with the updated context appended to `$CLARIFICATIONS`.

## Step 5: Transition to Round 3

Collected data for Round 3:
- `$FINAL_TASKS`: approved task list with dependency graph
- `$INPUT_TYPE`: `file` or `linear_issue` (from Round 1)
- `$SOURCE_ISSUE_ID`: source issue identifier (only when `$INPUT_TYPE` is `linear_issue`)
- `$INPUT_CONTENT`: original requirement (for Linear issue descriptions)
- `$ANALYSIS`: original analysis (for project context)
