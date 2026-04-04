<p align="center">
  <img src="assets/banner.jpg" width="600" alt="linear-prism">
</p>

# linear-prism

[![Claude Code](https://img.shields.io/badge/Claude%20Code-Plugin-purple)](https://claude.ai/code)
[![Codex CLI](https://img.shields.io/badge/Codex%20CLI-Compatible-10a37f)](https://developers.openai.com/codex/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Decompose requirements into implementation-ready tasks and register them in [Linear](https://linear.app)** — through interactive dialog, with dependency graphs and Design Doc boundaries.

## Why

Task decomposition is the bottleneck in agentic development. Get the boundaries wrong and every downstream agent — design, implementation, review — works against a flawed plan. The damage compounds silently because each agent operates in its own context.

Common failure modes:
- **Vague input goes unquestioned** — the tool guesses instead of asking, producing tasks that look reasonable but miss critical boundaries
- **Granularity is inconsistent** — some tasks are too large to design in one pass, others are too small to verify independently
- **Dependencies stay implicit** — teams discover blocking relationships during implementation, not during planning
- **Decisions made in conversation are lost** — the person who broke down the work remembers the trade-offs, but the issue tracker doesn't

linear-prism addresses these by running an interactive quality gate before decomposition, structuring each task with explicit assumptions, key decisions, and Design Doc boundaries, and registering everything in Linear where progress is visible to the whole team.

## What It Looks Like

**Input**: A one-line Linear issue — "Improve image generation performance"

```
Quality Gate:
  Objective clarity: pass
  Service scope:     pass (inferred from codebase)
  Testability:       fail — no measurable target
  Completeness:      fail — cache strategy undefined

→ Blocks decomposition. Asks:
  1. What is your latency target?
  2. Cache prompt results, generated images, or both?
  3. In-memory only, or persistent across restarts?
```

After dialog, produces 5 tasks with dependency graph:

```
T1 [shared_prerequisite] — Pipeline timing instrumentation
T2 [shared_prerequisite] — Generic in-memory cache
T3 [value_unit]          — Prompt enhancement cache    (depends: T2)
T4 [value_unit]          — Generated image cache       (depends: T2)
T5 [value_unit]          — Cache config via env vars   (depends: T2)
```

Each issue in Linear includes the goal, affected services, Design Doc scope, assumptions, and key decisions from the dialog — so the person (or agent) picking up the task has the full context.

**Input**: A detailed PRD with P0/P1 priorities

```
Quality Gate: all pass + 4 clarification questions about shared components

→ Hybrid strategy: extract shared batch execution engine,
  then vertical slice per feature

T1 [shared_prerequisite] — Batch types + execution engine
T2 [value_unit]          — batch_generate tool          (depends: T1)
T3 [value_unit]          — Progress reporting            (depends: T1, T2)
T4 [value_unit]          — batch_edit tool               (depends: T1)
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
Round 1: Quality Gate
    ├── Fetch and analyze requirements
    ├── Assess: objective clarity, service scope, testability, completeness
    └── Block → ask specific questions, or proceed with clarifications
    │
Round 2: Decomposition
    ├── Select slicing strategy (vertical / horizontal / hybrid)
    │   based on feature independence and shared dependency count
    ├── Extract shared prerequisites
    ├── Produce typed tasks with Design Doc boundaries per service
    ├── Build dependency graph and coverage map
    └── User review: approve / adjust / redo (nothing registers without approval)
    │
Round 3: Registration
    ├── Create parent issue (PRD input) or use source issue (Linear input)
    ├── Register sub-issues with blocking relations
    └── Fallback: Markdown drafts if Linear MCP unavailable
```

### Task Types

| Type | Purpose | Example |
|------|---------|---------|
| `value_unit` | One coherent deliverable with independent acceptance criteria | "User can submit batch image generation request" |
| `shared_prerequisite` | Foundation needed by 2+ later tasks at a shared boundary | "Implement generic cache with TTL and LRU eviction" |
| `adr` | Technical decision that spans multiple tasks | "Select message queue technology" |

### What Goes Into Each Issue

- **Goal**: What is true after completion
- **Design Doc Units**: Per-service scope — ready for downstream design tools
- **Dependencies**: Blocking relations, not just comments
- **Assumptions**: What this task takes for granted (so the implementer can verify)
- **Key Decisions**: Trade-offs decided during dialog (so they survive context switches)

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
├── recipe-decompose/           Orchestrator (3-round dialog)
│   ├── SKILL.md
│   ├── agents/openai.yaml      Codex: invocation policy + MCP dependency
│   └── references/
│       ├── analyze.md          Round 1: quality gate
│       ├── plan.md             Round 2: decomposition + review
│       └── register.md         Round 3: Linear registration
└── decomposition-guide/        Knowledge skill (loaded by agent)
    ├── SKILL.md
    └── agents/openai.yaml

agents/
└── task-decomposer-linear.md   Claude Code agent (analyze/decompose/revise/register_draft)

.codex/agents/
└── task-decomposer-linear.toml Codex agent (same logic, TOML format)
```

---

## What Happens After Decomposition

Each registered issue contains enough structured context — goal, Design Doc scope, assumptions, key decisions — for an LLM to pick it up and start design or implementation without re-asking the questions that were already answered during decomposition.

This means the issues work as inputs for any downstream workflow, whether human or agentic. Linear's [Codex integration](https://linear.app/integrations/codex) lets you mention `@Codex` on an issue to kick off a cloud agent directly from the task.

## License

MIT
