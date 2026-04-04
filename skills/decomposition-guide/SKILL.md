---
name: decomposition-guide
description: Guides task boundary decisions when splitting requirements into implementation-ready units. Use when determining task size, dependencies, or design doc scope.
---

# Overview

Defines criteria for splitting requirements into implementation tasks with explicit Design Doc boundaries and dependency graphs. Used by the task-decomposer-linear agent during decompose and revise modes.

# Task Decomposition Principles

## Value-Unit Definition

A value-unit task delivers one coherent, verifiable outcome:
- **User-facing value**: A behavior change observable by end users or API consumers.
- **System-facing value**: An infrastructure change that enables subsequent user-facing work (shared contract, migration, test harness).

Each value-unit task satisfies all of the following:
1. Produces a deployable or mergeable increment when completed.
2. Maps to one or more Design Documents, each scoped to a single service boundary.
3. Has explicit entry criteria (dependencies resolved) and exit criteria (verification passed).

## Task Types

| Type | When to use | Example |
|------|-------------|---------|
| `value_unit` | Delivers one coherent user-facing or system-facing value | "User can submit review from Word add-in" |
| `shared_prerequisite` | Two or more later tasks depend on the same missing foundation at a shared boundary | "Define shared API contract for review requests" |
| `adr` | A technical decision spans multiple tasks and lacks a recorded resolution | "Select message queue technology for async processing" |

### Shared Prerequisite Extraction

Create a `shared_prerequisite` task only when ALL conditions hold:
1. Two or more later value-unit tasks depend on the same missing piece.
2. The piece changes a shared boundary (contract, interface, infrastructure path, test harness).
3. Leaving it inside a later task forces that task to carry provisional design content or provisional dependencies.

When the split is ambiguous, keep the work inside the first affected value-unit task and record the uncertainty in `dependency_notes`.

## Slicing Strategy

### Vertical Slice (Feature-by-Feature)

Select when:
- Features share fewer than 2 data models.
- Each feature is independently deliverable and testable.
- Changes touch 3 or more layers per feature.

Each task delivers one end-to-end feature across all affected layers.

### Horizontal Slice (Layer-by-Layer)

Select when:
- Three or more features depend on a common foundation layer.
- The foundation requires stability verification before dependent work begins.
- Layer boundaries align with team ownership or deployment boundaries.

Foundation tasks precede dependent feature tasks in the dependency graph.

### Hybrid

Select when:
- Some features need foundation work while others are independent.
- Requirements are partially unclear and the approach may shift per phase.

Combine: extract shared foundation as `shared_prerequisite`, then slice remaining features vertically.

## Granularity Criteria

### Primary Indicators (use at decomposition time)

A well-sized task satisfies all of the following:
- Scoped to a single service boundary or a clearly defined cross-service interaction.
- Has at least one independently verifiable acceptance criterion.
- Has a dependency depth of at most 2 (depends on at most 2 sequential predecessors).

### Too Large (Split Further)

Indicators:
- Spans multiple unrelated service boundaries with no shared contract justifying the grouping.
- Requires two or more independent Design Documents for the same service.
- Contains both infrastructure setup and feature logic that serve different purposes.
- Acceptance criteria mix unrelated concerns (e.g., "API works AND UI renders AND migration completes").

### Too Small (Merge Upward)

Indicators:
- No independent acceptance criterion (only verifiable as part of a parent task).
- A helper or utility that exists only to serve one parent task.
- Configuration change that is meaningless without its parent feature.

### Supplementary Indicator (use when implementation scope is known)

Estimated file count can inform sizing when concrete enough to assess:
- 1-5 files: typical well-sized task.
- 6+ files across unrelated concerns: likely too large.

This indicator is unreliable at PRD or early requirement stage. Prefer the primary indicators above.

## Dependency Mapping

### Dependency Types

| Type | Description | Sequencing |
|------|-------------|-----------|
| **Data dependency** | Task B requires a schema, contract, or interface from Task A | A completes before B starts |
| **Build dependency** | Task B requires compiled output or deployed artifact from Task A | A completes before B starts |
| **Knowledge dependency** | Task B benefits from insights in Task A but can proceed with assumptions | A recommended before B; B records assumptions if proceeding |
| **ADR dependency** | Task B implements a design that depends on an unresolved technical decision | ADR task completes before B's Design Doc |

### Cross-Service Dependencies

When a task spans multiple services:
- Record each service in `affected_services`.
- Map each service to its own Design Doc in `design_doc_units`.
- Record inter-service sequencing in `dependency_notes` (which service boundary must stabilize first).

## Design Doc Boundary Rules

One Design Doc covers one service's scope within one task:
- **Scope**: The subset of the task's changes that occur within that service.
- **Boundary**: Defined by the service's API surface, data store, or deployment unit.
- **Cross-reference**: When two Design Docs in the same task share a contract, both reference the contract definition; only one owns it.

## Output Field Reference

Every task entry uses this fixed field order:

| Field | Required | Description |
|-------|----------|-------------|
| `task_id` | Yes | Sequential identifier (T1, T2, ...) |
| `task_type` | Yes | `value_unit`, `shared_prerequisite`, or `adr` |
| `title` | Yes | Imperative phrase describing the deliverable |
| `goal` | Yes | One sentence: what is true after this task completes |
| `affected_services` | Yes | List of service names touched by this task |
| `design_doc_units` | Yes | List of {service, doc_scope} pairs |
| `depends_on` | Yes | List of task_ids (empty list if none) |
| `dependency_notes` | Yes | List of strings explaining each dependency reason |
| `assumptions` | Yes | List of assumptions specific to this task (empty list if none). Each assumption belongs to exactly one task. |
| `key_decisions` | Yes | List of decisions from dialog that constrain this task (empty list if none). Each decision belongs to exactly one task. |