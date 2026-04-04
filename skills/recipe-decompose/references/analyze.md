# Round 1: Input Analysis and Quality Gate

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

## Step 3: Present Findings to User

Present the analysis as plain text (not AskUserQuestion). Include:

1. **Extracted objective** — one sentence summary of what the requirement delivers.
2. **Affected services** — list of identified services/components.
3. **Quality assessment** — for each criterion (objective clarity, service scope, testability, completeness), state pass or fail with a brief explanation.
4. **Issues found** — list blocking issues and clarification questions, if any.

### If `recommended_action` is `block`:

State: "The following issues prevent decomposition. Resolve them in the source document and re-run, or provide the missing information here."

List each blocking issue. Wait for user response.

After the user provides information:
- If the response resolves all blocking issues, incorporate the new context and re-invoke analysis to confirm resolution.
- If issues remain, repeat the block message with remaining items.

### If `recommended_action` is `clarify`:

State: "The requirement is sufficient for decomposition, but these points affect task boundaries. Answering them improves decomposition accuracy."

List each clarification question. Wait for user response.

After the user responds:
- Record the answers as `$CLARIFICATIONS` for Round 2.
- Proceed to Round 2 regardless of whether all questions are answered (record unanswered items as assumptions).

### If `recommended_action` is `proceed`:

State: "Requirement analysis complete. No blocking issues found."

Ask: "Proceed with decomposition? If you have additional context about services, dependencies, or priorities, share them now."

Wait for user response. Record any additional context as `$CLARIFICATIONS`.

## Step 4: Transition to Round 2

Collected data for Round 2:
- `$INPUT_CONTENT`: original requirement text
- `$INPUT_TYPE`: `file` (PRD/requirement document) or `linear_issue` (Linear URL) — determined in Step 1
- `$SOURCE_ISSUE_ID`: Linear issue identifier of the source issue (only when `$INPUT_TYPE` is `linear_issue`)
- `$ANALYSIS`: structured analysis result
- `$CLARIFICATIONS`: user-provided answers and additional context (may be empty)
