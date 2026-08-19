---
name: decomposition-guide
description: Guides task boundary decisions when splitting requirements into implementation-ready value units. Use when determining task size, responsibility scope, or real blocking dependencies.
---

# Overview

Defines criteria for independently verifiable implementation tasks with explicit responsibility scopes and real dependency edges. Used by the task-decomposer-linear agent during decompose and revise modes.

# Task Decomposition Principles

## Value-Unit Definition

A value-unit task delivers one coherent, verifiable outcome:
- **User-facing value**: A behavior change observable by end users or API consumers.
- **System-facing value**: An infrastructure change that enables subsequent user-facing work (shared contract, migration, test harness).

Each value-unit task satisfies all of the following:
1. Produces a deployable or mergeable increment when completed.
2. Has an independently observable completion condition.
3. Depends only on deliverables that must exist before its outcome can be completed or verified.

## Task Types

| Type | When to use | Example |
|------|-------------|---------|
| `value_unit` | Delivers one coherent user-facing or system-facing value | "User can submit review from Word add-in" |
| `shared_prerequisite` | Two or more later tasks depend on the same missing foundation at a shared boundary | "Define shared API contract for review requests" |

### Shared Prerequisite Extraction

Create a `shared_prerequisite` task only when ALL conditions hold:
1. Two or more later value-unit tasks depend on the same missing piece.
2. The piece changes a shared boundary (contract, interface, infrastructure path, test harness).
3. The boundary must stabilize before the earliest dependent value unit can complete and verify its outcome.

Limit the prerequisite to what the earliest executable value-unit task needs. When the split is ambiguous, keep the work inside that value-unit task and record the uncertainty in `dependency_notes`.

## Slicing Strategy

### Vertical Slice (Feature-by-Feature)

Use by default when each task can deliver and verify one outcome across its affected layers.

### Horizontal Slice (Layer-by-Layer)

Use only when a shared foundation is an independently verifiable deliverable that must stabilize before every dependent value unit can execute or verify its outcome.

### Hybrid

Use when shared prerequisite work is required and the remaining outcomes can be delivered as vertical value units.

## Granularity Criteria

A well-sized task owns one coherent outcome, names its responsibility scope, and has an independently observable completion condition.

### Too Large (Split Further)

Indicators:
- Contains independently valuable outcomes that can complete and be verified separately.
- Spans unrelated responsibility boundaries whose work has independently completable outcomes.
- Combines a prerequisite with later value work even though each is independently deliverable.

### Too Small (Merge Upward)

Indicators:
- Its completion is observable only through a parent task's acceptance criterion.
- Its helper or utility has one parent-task consumer.
- Its configuration gains meaning only with its parent feature.

## Dependency Mapping

### Dependency Types

| Type | Description | Sequencing |
|------|-------------|-----------|
| **Data dependency** | Task B requires a schema, contract, or interface from Task A | A completes before B starts |
| **Build dependency** | Task B requires compiled output or deployed artifact from Task A | A completes before B starts |
| **Knowledge relationship** | Task B benefits from insight from Task A but can proceed with a recorded assumption | Record as an assumption rather than a dependency edge |

### Cross-Service Dependencies

When a task spans multiple services:
- Record each service in `affected_services`.
- Map each service's owned part of the outcome in `service_scopes`.
- Record inter-service sequencing in `dependency_notes` only when one service deliverable must stabilize before another can execute or verify.

## Documentation Boundary

This decomposition records implementation responsibility. The downstream design workflow decides the documentation path because ADR and Design Doc necessity require confirmed implementation scope and repository evidence. Treat an existing approved ADR or Design Doc as governing context.

## Output Field Reference

Every task entry uses this fixed field order:

| Field | Required | Description |
|-------|----------|-------------|
| `task_id` | Yes | Sequential identifier (T1, T2, ...) |
| `task_type` | Yes | `value_unit` or `shared_prerequisite` |
| `title` | Yes | Imperative phrase describing the deliverable |
| `goal` | Yes | One sentence stating the observable condition that proves this task complete |
| `affected_services` | Yes | List of service names touched by this task |
| `service_scopes` | Yes | List of {service, scope} pairs describing implementation responsibility |
| `depends_on` | Yes | List of task_ids (empty list if none) |
| `dependency_notes` | Yes | List of strings explaining each dependency reason |
| `assumptions` | Yes | List of unresolved conditions that materially constrain this task (empty list if none) |
| `key_decisions` | Yes | List of user decisions that materially constrain this task (empty list if none) |
