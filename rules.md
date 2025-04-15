# Project Rules & Guidelines: Voice-Driven AI Coding Assistant

This document outlines the key rules, guidelines, and principles to adhere to during the development of the Voice-Driven AI Coding Assistant.

## Core Principles

1.  **Safety First:** The absolute priority is to prevent the application or the integrated AI from causing unintended harm to the user's system. All file operations and command executions MUST be strictly confined to the designated virtualized project environment (`VIRTUAL_ROOT`).
2.  **Local Primary:** Design and implement features with local execution (on macOS M3+) as the primary target. Leverage local AI models (Ollama/llama.cpp), local STT, and local tools whenever feasible for privacy, speed, and offline capability.
3.  **User Control & Transparency:** While automation is key, provide mechanisms for user oversight. Log actions clearly. Consider confirmation steps for potentially destructive operations initially.
4.  **Modularity & Maintainability:** Build components with clear responsibilities and interfaces (especially if using MCP). Keep code clean, organized, and well-documented. Adhere to file size limits (e.g., < 300 lines) and refactor proactively.
5.  **Simplicity:** Prefer simple, robust solutions over complex ones, especially in early phases. Iterate and add complexity gradually.

## Development Rules

*   **DO NOT** allow any file system access (read, write, delete) or command execution outside the defined `VIRTUAL_ROOT` boundary. Rigorously test path validation (`safe_path`).
*   **DO NOT** bypass the virtualized environment checks for any reason.
*   **ALWAYS** commit changes to the local Git repository after significant AI actions (file creation/modification) within the `VIRTUAL_ROOT`.
*   **ALWAYS** handle errors gracefully for file operations, subprocess calls, AI model interactions, and API calls. Provide informative feedback to the user or logs.
*   **PREFER** using the integrated local AI model (via the `run_ollama` wrapper or MCP) for tasks like code generation, modification, and analysis.
*   **AVOID** hardcoding absolute paths outside the `VIRTUAL_ROOT` context. Use relative paths within the virtual environment or construct paths using `VIRTUAL_ROOT`.
*   **AVOID** relying solely on cloud services for core functionality if a local alternative is feasible and meets requirements.
*   **DO NOT** introduce complex new patterns or technologies without first attempting to solve the problem using existing patterns.
*   **ALWAYS** check for existing code/functionality before writing new code to avoid duplication.
*   **ENSURE** all code related to file system interaction or execution rigorously enforces the `VIRTUAL_ROOT` boundary.
*   **WRITE** tests for critical components, especially safety mechanisms (virtual root validation) and core workflows.
*   **ITERATE** on existing functionality rather than making drastic changes without discussion.
*   **FOCUS** on the tasks defined in `task.md`. Do not add unrelated features without discussion.
*   **DISCUSS** significant architectural changes, visual changes (UI), or deviations from the plan before implementation.

## AI Interaction Rules

*   **SANITIZE** or carefully review prompts sent to the AI, especially if they include user input, to prevent prompt injection or unintended requests.
*   **VALIDATE** AI-generated code where possible (e.g., basic syntax checks) before saving or executing.
*   **BE AWARE** of potential AI hallucinations or incorrect outputs; implement checks or fallback logic where critical.
*   **DO NOT** implicitly trust AI-generated commands for execution without review or safety checks (e.g., filter dangerous commands like `rm -rf /`).

## Environment Rules

*   **ENSURE** Docker containers run with appropriate isolation and resource limits.
*   **MANAGE** container lifecycles properly (start, stop, cleanup).
*   **SECURE** any remote MCP servers with appropriate authentication/authorization if implemented. 