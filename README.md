<p align="center">
  <img src="assets/banner.jpg" width="600" alt="linear-prism">
</p>

# linear-prism

[![Claude Code](https://img.shields.io/badge/Claude%20Code-Plugin-purple)](https://claude.ai/code)
[![Codex CLI](https://img.shields.io/badge/Codex%20CLI-Compatible-10a37f)](https://developers.openai.com/codex/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Turn a Linear issue or requirement document into a small set of independently verifiable tasks, then register the approved result in [Linear](https://linear.app).** linear-prism reads the repository to understand where the work belongs, asks only when a product decision would change the task boundaries, and records actual blocking relationships.

## Why

Requirements describe the desired behavior, but often not where the work belongs or which steps truly block others. Splitting them mechanically can create layer-by-layer tasks, speculative prerequisites, and questions the codebase could answer.

linear-prism reads the requirement and repository together. It keeps work in one task when the outcome can be completed and verified together, separates independently valuable outcomes and genuine shared prerequisites, and records the approved result in Linear. A person or coding agent can pick up each issue without reconstructing the original conversation.

## What It Looks Like

**Input**: A one-line Linear issue — "Improve image generation performance"

```
Outcome and Scope Analysis:
  Objective:    needs input — "performance" has no observable target
  Scope:        ready (supported by repository evidence)
  Verification: needs input — success cannot yet be measured

Question:
  What user-visible operation and measurable target define success?
```

After the user confirms "reduce P95 image-generation latency by 30% without changing the response contract," the repository shows that one component owns the change, so linear-prism keeps it as one task:

```
T1 [value_unit] — Meet the P95 generation-latency target
```

The registered issue includes the latency target, responsible service, unchanged response contract, and observable completion condition. Cache choice and persistence remain downstream design decisions instead of becoming extra tasks or user questions.

**Input**: A requirement document with two batch operations that share a contract

```
Outcome and verification boundary: ready

→ Hybrid strategy: the shared request/result contract must stabilize before
  either value unit can be completed and verified; each operation then proceeds vertically

T1 [shared_prerequisite] — Establish the shared batch request/result contract
T2 [value_unit]          — batch_generate tool          (depends: T1)
T3 [value_unit]          — batch_edit tool               (depends: T1)
```

---

## Prerequisites

- [Claude Code](https://claude.ai/code) or [Codex CLI](https://developers.openai.com/codex/cli)
- [Linear](https://linear.app) account with MCP access
- Git repository

## Quick Start

### Claude Code

```bash
claude

# Inside Claude Code:
/plugin marketplace add shinpr/linear-prism
/plugin install linear-prism@linear-prism

# Restart session, then:
/linear-prism:recipe-decompose https://linear.app/team/issue/ENG-123
/linear-prism:recipe-decompose docs/prd.md
```

### Codex CLI

```bash
cd your-project
npx linear-prism install
codex mcp login linear
```

Then in Codex:

```
$recipe-decompose https://linear.app/team/issue/ENG-123
$recipe-decompose docs/prd.md
```

---

## How It Works

```
Input (Linear issue URL or PRD file)
    │
Round 1: Outcome and Scope Analysis
    ├── Fetch and analyze requirements
    ├── Inspect repository evidence for responsibility boundaries
    └── Ask only for missing user-owned outcome or scope decisions
    │
Round 2: Decomposition
    ├── Select slicing strategy (vertical / horizontal / hybrid)
    │   from independent outcomes and real blocking dependencies
    ├── Extract shared boundaries only when needed before
    │   their earliest dependent task can complete and be verified
    ├── Produce typed tasks with service responsibility scopes
    ├── Build dependency graph and coverage map
    └── User review: approve or describe the desired change (nothing registers without approval)
    │
Round 3: Registration
    ├── Create parent issue (PRD input) or use source issue (Linear input)
    ├── Register sub-issues with blocking relations
    └── Stop if the required Linear connection is unavailable
```

### Task Types

| Type | Purpose | Example |
|------|---------|---------|
| `value_unit` | One coherent outcome with an independently observable completion condition | "User can submit batch image generation request" |
| `shared_prerequisite` | Shared boundary required before its earliest dependent value unit can complete and be verified | "Establish shared batch request/result contract" |

### What Goes Into Each Issue

- **Goal**: The observable condition that proves the task complete
- **Service Scopes**: Per-service implementation responsibility without prescribing document creation
- **Dependencies**: Blocking relations, not just comments
- **Assumptions**: What this task takes for granted (so the implementer can verify)
- **Key Decisions**: User-owned outcome and scope decisions from dialog

---

## Installation

### Claude Code

The plugin bundles Linear MCP configuration. After installation, authenticate with `/mcp`.

### Codex CLI

```bash
npx linear-prism install
```

Copies into your project:
- `.agents/skills/` — Skill files (recipe-decompose, decomposition-guide)
- `.codex/agents/` — Subagent TOML definition
- `.codex/config.toml` — Linear MCP configuration (merged if config exists)

```bash
npx linear-prism update --dry-run   # Preview changes
npx linear-prism update             # Apply updates
npx linear-prism status             # Check installed version
```

Locally modified files are preserved during updates.

---

## Architecture

```
skills/
├── recipe-decompose/           Orchestrator (analysis, review, registration)
│   ├── SKILL.md
│   ├── agents/openai.yaml      Codex: invocation policy + MCP dependency
│   └── references/
│       ├── analyze.md          Round 1: outcome and scope analysis
│       ├── plan.md             Round 2: decomposition + review
│       └── register.md         Round 3: Linear registration
└── decomposition-guide/        Knowledge skill (loaded by agent)
    ├── SKILL.md
    └── agents/openai.yaml

agents/
└── task-decomposer-linear.md   Claude Code agent (analyze/decompose/revise)

.codex/agents/
└── task-decomposer-linear.toml Codex agent (same logic, TOML format)
```

---

## What Happens After Decomposition

Each registered issue includes its completion condition, responsibility scope, assumptions, and user decisions. A person or coding agent can start the appropriate design or implementation work without reconstructing the original conversation. Whether that work needs an ADR or Design Doc remains a downstream decision based on confirmed implementation scope and repository evidence.

With Linear's [Codex integration](https://linear.app/integrations/codex), mention `@Codex` on an issue to start a cloud agent directly from the task.

## License

MIT
