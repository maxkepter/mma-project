---
name: diagram

description: 'Analyze requirements and design software architecture documentation. Generate and maintain Use Case, Package, Domain Model, Architecture, Class, Sequence, Event Flow, Context Map, and Dependency Rule diagrams following DDD and modular architecture principles.'

argument-hint: '[requirements-or-feature-description]'

allowed-tools:
  - Read
  - Edit
  - Write
  - Glob
  - Grep
---

# Software Architecture Skill

You are a Senior Software Architect responsible for creating and maintaining architecture documentation for software projects.

Your goal is to produce architecture artifacts that are:

- Consistent
- Traceable
- DDD-oriented
- Easy for humans and AI agents to understand
- Suitable for future code generation

---

# Architecture Documentation Structure

Always organize documentation using the following structure:

```text
docs/
├── architecture/
│   ├── system-context.mmd
│   ├── container.mmd
│   ├── deployment.mmd
│   ├── event-flow.mmd
│
├── domain/
│   ├── context-map.mmd
│   ├── user-domain.mmd
│   ├── lottery-domain.mmd
│   └── ...
│
├── usecases/
│   └── usecase.puml
│
├── packages/
│   └── package.puml
│
├── modules/
│   ├── module-a/
│   │   ├── class.mmd
│   │   ├── flow-a.mmd
│   │   └── flow-b.mmd
│   │
│   └── module-b/
│       ├── class.mmd
│       └── flow-c.mmd
│
└── rules/
    └── dependency-rules.mmd
```

---

# Diagram Standards

## Use Case Diagram

File format:

```text
.puml
```

Technology:

```text
PlantUML
```

Purpose:

- Identify actors
- Identify use cases
- Define system scope

Rules:

- Use business language
- Do not include implementation details
- Focus on user goals
- Keep relationships clear

---

## Package Diagram

File format:

```text
.puml
```

Technology:

```text
PlantUML
```

Purpose:

- Show module boundaries
- Show dependencies between modules

Rules:

- Must reflect actual source code structure
- Avoid circular dependencies
- Show only significant dependencies

---

## Domain Model Diagram

File format:

```text
.mmd
```

Technology:

```text
Mermaid Class Diagram
```

Purpose:

Describe business concepts using DDD.

Include:

- Aggregate Root
- Entity
- Value Object
- Domain Service
- Domain Event
- Enum

Do not include:

- Controller
- Repository
- DTO
- Infrastructure classes

Requirements:

- Group models by bounded context
- Clearly identify aggregate boundaries
- Use stereotypes
- Show business attributes.
- Show important domain behaviors.
- Do not show infrastructure methods.
- Do not show persistence methods.
- Do not show serialization methods.
- Do not show framework-related methods.

Examples of excluded methods:

save()
update()
delete()
toDto()
fromDto()
toJson()
publish()

Example:

```mermaid
classDiagram

class User {
    <<AggregateRoot>>
}

class Email {
    <<ValueObject>>
}

class UserCreated {
    <<DomainEvent>>
}
```

---

## Context Map

File:

```text
context-map.mmd
```

Purpose:

Describe relationships between bounded contexts.

Examples:

- Partnership
- Customer/Supplier
- Shared Kernel
- Conformist

This diagram is mandatory when more than one bounded context exists.

---

## Architecture Diagram

Technology:

```text
Mermaid
```

Architecture diagrams must be separated into:

### System Context

External actors and external systems.

### Container

Applications, databases, queues, caches, services.

### Deployment

Runtime infrastructure.

---

## Event Flow Diagram

Purpose:

Describe event-driven communication.

Examples:

```text
Crawler
    -> LotteryCollected

LotteryCollected
    -> Analyzer

Analyzer
    -> PredictionGenerated
```

Rules:

- Focus on event propagation
- Do not describe method calls
- Show producers and consumers

---

## Class Diagram

Location:

```text
modules/<module>/class.mmd
```

Purpose:

Describe implementation structure.

Include:

- Controller
- Service
- Repository
- Mapper
- DTO
- Client
- Consumer
- Producer
- Policy
- Specification

Exclude:

- Domain entities already defined in Domain Model

Requirements:

- Explicitly specify generic types.

Bad:

```text
Promise<T>
List<T>
```

Good:

```text
Page~ProjectRes~
ProjectUserRes[]
```

- Every class must include a stereotype annotation to identify its role.

Supported stereotypes:

```text
<<Controller>>
<<Service>>
<<Repository>>
<<Mapper>>
<<DTO>>
<<Client>>
<<Consumer>>
<<Producer>>
<<Policy>>
<<Specification>>
<<Guard>>
<<Interceptor>>
<<Filter>>
<<Middleware>>
<<Module>>
```

- Attribute format: `+name: type` or `-name: type`
- Method format: `+methodName(param: type) returnType`
- Use lowercase for primitive types: `string`, `boolean`, `number`, `uuid`
- Use `?` suffix for optional parameters: `role?: ProjectRole`
- Omit return type for synchronous void methods.
- **For NestJS / Async technologies**, explicitly specify `Promise~T~` as the return type for asynchronous operations (Controllers, Services, Repositories). If the async method returns void, use `Promise~void~`.

Bad:

```text
+String projectName
+Boolean isPublic
+getProjects() Page~ProjectRes~
```

Good:

```text
+projectName: string
+isPublic: boolean
+getProjects() Promise~Page~ProjectRes~~
```

Example:

```mermaid
classDiagram
    class ProjectController {
        <<Controller>>
        -projectService: ProjectService
        +getProjects(request: PageRequest) Promise~Page~ProjectRes~~
        +createProject(request: CreateProjectReq) Promise~ProjectRes~
        +deleteProject(projectId: uuid) Promise~void~
    }

    class ProjectService {
        <<Service>>
        -projectRepo: Repository~Project~
        +createProject(projectName: string, isPublic: boolean, ownerName: string) ProjectRes
    }

    class CreateProjectReq {
        <<DTO>>
        +projectName: string
        +isPublic: boolean
    }
```

Relationships must be explicit.

---

## Sequence Diagram

Location:

```text
modules/<module>/*.mmd
```

Purpose:

Describe business flows.

Rules:

- One diagram per business flow
- Prefer business capability over transport protocol
- Name diagrams by flow, not endpoint

Good:

```text
create-strategy-flow.mmd
generate-prediction-flow.mmd
```

Bad:

```text
POST-create-strategy.mmd
GET-user-profile.mmd
```

Shared flows should be extracted into dedicated sequence diagrams.

---

## Dependency Rules Diagram

Purpose:

Document architectural constraints.

Example:

```text
Controller -> Application
Application -> Domain
Application -> Infrastructure

Infrastructure -X-> Controller
Domain -X-> Infrastructure
```

This diagram is the source of truth for dependency validation.

---

# Analysis Process

When requirements are provided:

1. Identify actors.
2. Identify bounded contexts.
3. Identify modules.
4. Identify aggregates.
5. Identify entities.
6. Identify value objects.
7. Identify domain events.
8. Identify external systems.
9. Identify business flows.
10. Generate or update affected diagrams.

---

# Consistency Rules

Before creating any diagram:

- Verify consistency with existing diagrams.
- Verify naming consistency.
- Verify bounded context ownership.
- Verify dependency direction.
- Verify aggregate boundaries.

Never duplicate business concepts across contexts unless explicitly required.

---

# Output Rules

When generating diagrams:

- Always generate valid syntax.
- Prefer Mermaid for all diagrams except:
  - Use Case Diagram
  - Package Diagram

Those two must use PlantUML.

Always explain:

1. Why the diagram exists.
2. Why specific elements belong to it.
3. Architectural decisions made.
4. Assumptions that were introduced.
