# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Speckit Enhancer** is a comprehensive enhancement suite for Spec-Kit workflow, providing:

- **Dashboard**: A serverless web-based UI for visualizing, editing, and commenting on Spec-Kit workflow documents
- **CLI**: Command-line interface for file operations and local server management
- **Future**: Planned enhancements for Spec-Kit commands and workflows

The project maintains a serverless architecture where all state and data persistence occurs through the local file system, aligning with Spec-Kit's philosophy of specification-driven development.

## Project Architecture

This repository uses a specification-driven development workflow based on the Spec-Kit system. The architecture follows a structured approach:

- **Feature Specification**: Each feature starts with a detailed specification in `specs/[number]-[feature-name]/spec.md` that defines user stories, requirements, and success criteria
- **Implementation Planning**: After specification, a plan is created in `plan.md` within the feature directory, outlining technical context, project structure, and constitution checks
- **Task Management**: Implementation tasks are generated in `tasks.md` with clear organization by user story and dependency management

The workflow is driven by slash commands that automate key processes:

- `/speckit.specify`: Creates or updates feature specifications from natural language descriptions
- `/speckit.plan`: Generates implementation plans using the plan template
- `/speckit.tasks`: Creates actionable, dependency-ordered task lists based on design artifacts
- `/speckit.implement`: Executes the implementation plan by processing all tasks in `tasks.md`
- `/speckit.clarify`: Identifies underspecified areas and resolves ambiguities in feature specs
- `/speckit.analyze`: Performs cross-artifact consistency analysis across spec, plan, and tasks
- `/speckit.checklist`: Generates custom checklists for specific quality dimensions
- `/speckit.constitution`: Manages the project constitution and ensures alignment with core principles

## Key Directories and Files

- `.specify/`: Contains templates, scripts, and memory for the specification system
  - `.specify/templates/`: Templates for specifications, plans, tasks, and agent contexts
  - `.specify/scripts/bash/`: Bash scripts for workflow automation and validation
  - `.specify/memory/constitution.md`: Project constitution with core principles and governance rules
- `.claude/commands/`: Slash command definitions that expand into detailed prompts
- `specs/`: Directory containing all feature specifications organized by numbered branches
- `dashboard/`: Web-based SPA for document visualization and management (formerly `frontend/`)
- `cli/`: Command-line interface for serving dashboard and file operations

## Workflow Commands

The primary workflow follows these steps:

1. **Specification**: Use `/speckit.specify` followed by your feature description to create a new feature branch and specification
2. **Planning**: Run `/speckit.plan` to generate an implementation plan based on the specification
3. **Task Generation**: Execute `/speckit.tasks` to create a detailed task list from the plan
4. **Implementation**: Use `/speckit.implement` to execute all tasks in order
5. **Analysis**: Run `/speckit.analyze` to validate consistency across artifacts before implementation
6. **Clarification**: Use `/speckit.clarify` to resolve any ambiguities in specifications
7. **Checklists**: Generate quality checklists with `/speckit.checklist` for specific domains like security, UX, or testing

## Development Scripts

Key bash scripts in `.specify/scripts/bash/`:

- `check-prerequisites.sh`: Validates required files exist for current workflow phase
- `common.sh`: Shared functions for path resolution and environment detection
- `create-new-feature.sh`: Creates new feature branches with proper numbering
- `setup-plan.sh`: Initializes implementation plan from template
- `update-agent-context.sh`: Updates AI agent context files with information from `plan.md`

## Active Technologies
- Node.js 18+ (LTS), TypeScript 5.x + React 18, Vite 5, Marked.js (Markdown 渲染), Prism.js (语法高亮), Commander.js (CLI 框架) (001-speckit-ui-viewer)
- 本地文件系统 (`.specify/memory/comments/` 用于评论存储,JSON 格式) (001-speckit-ui-viewer)
- TypeScript 5.x + React 18, Vite 5, Recharts 2.x, date-fns 4.x, jsPDF 2.x, papaparse 5.x, react-window 1.x, Zustand 4.x (状态管理) (002-feature-dashboard)
- 本地文件系统(specs/[feature-id]/, .specify/memory/comments/) (002-feature-dashboard)

## Recent Changes
- 001-speckit-ui-viewer: Added Node.js 18+ (LTS), TypeScript 5.x + React 18, Vite 5, Marked.js (Markdown 渲染), Prism.js (语法高亮), Commander.js (CLI 框架)
