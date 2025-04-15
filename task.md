# Project Tasks: Voice-Driven AI Coding Assistant

This document lists the development tasks required to build the Voice-Driven AI Coding Assistant, based on the defined architecture.

## Phase 1: Core Setup & Local AI Integration

1.  **Project Initialization:**
    *   Set up project structure (directories for source, tests, config, etc.).
    *   Initialize main application framework (e.g., Python with FastAPI/Flask for backend, or Swift project for native macOS UI).
    *   Set up dependency management (`requirements.txt` or `Package.swift`).

2.  **Virtualized Project Environment:**
    *   Implement the core logic for the safe, virtualized directory (`VIRTUAL_ROOT`).
    *   Create `safe_path` function to prevent directory traversal.
    *   Implement basic file read/write operations within the virtual root.

3.  **Local AI Core Setup (Ollama/llama.cpp):**
    *   Install Ollama or build llama.cpp.
    *   Download a suitable local code model (e.g., `codellama:7b`, `codestral`).
    *   Create a wrapper function (`run_ollama` or similar) to interact with the local LLM via `subprocess`.
    *   Test basic code generation prompts.

4.  **Basic Speech-to-Text (STT):**
    *   Integrate a local STT solution (e.g., Apple's Speech Framework for Swift, or `whisper.cpp` Python bindings).
    *   Implement audio capture (if building UI) or provide a way to input audio files.
    *   Test transcription accuracy.

5.  **Basic Intent Parsing:**
    *   Implement simple keyword matching or rule-based logic to parse transcripts into basic commands (e.g., "generate code", "save file").

6.  **Basic Code Generation Workflow:**
    *   Connect STT -> Intent Parsing -> AI Core.
    *   Generate code based on a simple voice command.
    *   Save the generated code to the virtualized directory using the safe file operations.

7.  **Automated Git Versioning:**
    *   Initialize Git within the `VIRTUAL_ROOT` programmatically if it doesn't exist.
    *   Install `GitPython`.
    *   Implement `commit_changes` function to stage and commit all changes within `VIRTUAL_ROOT` after file operations.
    *   Integrate commits into the code generation workflow.

## Phase 2: Environment Management & Execution

8.  **Tech Stack Detection:**
    *   Implement heuristic-based detection (keyword matching in prompts/code).
    *   *Later:* Enhance with AI Core for more robust detection.

9.  **Docker Environment Manager:**
    *   Install Docker Desktop (if not present).
    *   Create Dockerfile templates for common stacks (e.g., Python, Node.js).
    *   Implement `setup_container` function using `subprocess` to build and run Docker containers, mounting `VIRTUAL_ROOT`.
    *   Implement `deploy_to_container` (e.g., restart container).

10. **Secure Execution Engine:**
    *   Implement `run_in_container` function using `docker exec`.
    *   Implement `run_safe_command` for local scripts (using `subprocess` with `cwd=VIRTUAL_ROOT`).
    *   Integrate execution into the workflow (e.g., voice command "run script.py").

## Phase 3: Browser Integration & Advanced Features

11. **Browser Interaction Setup (Playwright):**
    *   Install Playwright and browser binaries.
    *   Implement `get_browser_data` function to launch a browser, navigate to a URL, capture console logs, and take screenshots.

12. **AI-Powered Troubleshooting (Logs):**
    *   Feed captured console logs to the AI Core.
    *   Implement logic to prompt the AI to analyze logs and suggest code fixes.
    *   *Later:* Integrate screenshot analysis if using a multimodal model.

13. **Auto-Fix Workflow:**
    *   Create a loop: Run code -> Check browser logs -> If errors, get AI fix -> Apply fix -> Commit -> Redeploy -> Repeat.

14. **Model Context Protocol (MCP) Integration (Optional):**
    *   Set up an MCP server (local first).
    *   Refactor tool interactions (Docker, Git, Playwright, File System, AI Core) to use MCP tools.
    *   Update application logic to use an MCP client.
    *   Test local MCP setup.
    *   *Later:* Deploy MCP server remotely and test portability.

15. **UI/UX Refinements (macOS App):**
    *   Build a native Swift UI for voice input, status display, configuration.
    *   Integrate backend logic (potentially running as a separate Python process or embedded Python).
    *   Handle macOS permissions for microphone, file access, automation.

## Phase 4: Testing & Polish

16. **Testing:**
    *   Write unit tests for core components (virtual root, Git interaction, Docker management).
    *   Write integration tests for key workflows (voice -> code -> commit -> run -> check browser -> fix).
    *   Test edge cases for safety (e.g., prompts asking to delete files outside the root).

17. **Error Handling & Robustness:**
    *   Add comprehensive error handling for file operations, subprocess calls, API interactions, etc.
    *   Improve user feedback for errors or long-running tasks.

18. **Documentation:**
    *   Update architecture, tasks, and rules documents.
    *   Add user guide/setup instructions.

19. **Performance Optimization:**
    *   Profile local model inference times.
    *   Optimize Docker builds and container startup.
    *   Refine STT and NLP steps for speed. 

## Current Task: Phase 1, Task 2

**Vite Configuration (`vite.config.js`):**

*   Integrate `monacoEditorPlugin`.
*   Configure options (language workers, etc.).
*   Ensure `optimizeDeps` is suitable for Electron.
*   **Crucially:** Configure Vite to resolve/handle dynamic imports from `plugins/` (e.g., using aliases, build copies, or symlinks). Test this early. 