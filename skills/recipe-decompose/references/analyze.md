# Round 1: Outcome and Scope Analysis

## Step 1: Fetch Input

Determine input type from `$ARGUMENTS`:

| Input pattern | Action |
|---------------|--------|
| URL containing `linear.app` | Fetch the issue via Linear MCP (`get_issue`). Extract title, description, comments, labels, project context. Record the issue identifier as `$SOURCE_ISSUE_ID`. |
| File path (ends with `.md`, `.txt`, or other document extension) | Read the file content using the Read tool. |
| Empty or ambiguous | Ask the user: "Provide a Linear issue URL or a path to a PRD/requirement document." |

Store the raw content as `$INPUT_CONTENT`.

## Step 2: Invoke Analysis

Invoke the task-decomposer-linear agent in `analyze` mode:

```
subagent_type: linear-prism:task-decomposer-linear
description: "Analyze requirement quality"
prompt: |
  mode: analyze
  input_type: $INPUT_TYPE
  source: |
    $INPUT_CONTENT
```

Store the result as `$ANALYSIS`.

## Step 3: Route the Result

Keep observed source or repository facts separate from inferred implications. Include:

1. **Extracted objective** — one sentence summary of what the requirement delivers.
2. **Affected services** — list of identified services/components.
3. **Verification boundary** — the observable result that can prove the objective.
4. **Assumptions** — only unresolved conditions that materially constrain task boundaries.

### If `recommended_action` is `needs_input`:

Present the observed evidence and its effect on the decomposition boundary. Ask only the returned questions whose answers require the user's product intent, scope decision, or exclusion.

Wait for the user response, preserve the original source, add the answer as clarification context, and re-invoke analysis.

Repeat when the new answer leaves a different user-owned decision unresolved. When the same condition remains with unchanged information, report the exact missing decision and wait for new input.

### If `recommended_action` is `proceed`:

Present a compact analysis summary and proceed directly to Round 2 in the same invocation. The user's original decomposition request already authorizes this reversible step.

Carry repository-local implementation choices, document routing, and reversible technical decisions as evidence or material uncertainty in `$ANALYSIS.assumptions` for the downstream design step.

## Step 4: Transition to Round 2

Collected data for Round 2:
- `$INPUT_CONTENT`: original requirement text
- `$INPUT_TYPE`: `file` (PRD/requirement document) or `linear_issue` (Linear URL) — determined in Step 1
- `$SOURCE_ISSUE_ID`: Linear issue identifier of the source issue (only when `$INPUT_TYPE` is `linear_issue`)
- `$ANALYSIS`: structured analysis result
- `$CLARIFICATIONS`: user-provided outcome or scope decisions (may be empty)
