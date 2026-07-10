# QEVRYN Cybersecurity Whitepaper
**Security Architecture & Threat Mitigation Framework**  
**Version**: 0.1-Release  
**Author**: Built by Veeomdecoders

## 1. Executive Summary
QEVRYN is a local-first, premium AI intelligence layer engineered for Windows 10/11 and Linux environments. Unlike traditional AI applications that act as thin clients for remote cloud processing APIs, QEVRYN is constructed with a "Local Isolation" security philosophy. This whitepaper details the defensive controls, architectural boundaries, and sandbox mechanisms that protect user intellectual property, codebase integrity, and secrets.

## 2. Threat Modeling & Isolation Boundaries
QEVRYN operates with a modular boundaries design, separating user data into strict isolation zones:

```
+-------------------------------------------------------------+
|                     QEVRYN DESKTOP SHELL                    |
|  +---------------------+           +---------------------+  |
|  |   Frontend UI       | <=======> |   Express Backend   |  |
|  |   (Vite + React)    |           |   (Local Node runtime)| |
|  +---------------------+           +---------+-----------+  |
+----------------------------------------------|--------------+
                                               |
                                               v
                             +-----------------+-----------------+
                             |    QEVRYN Core Router/Sandbox     |
                             |  * Dangerous Command Filter     |
                             |  * SSRF Shield                  |
                             |  * Local SQLite & Vector Store  |
                             +-----------------+-----------------+
                                               |
                     +-------------------------+-------------------------+
                     |                                                   |
                     v                                                   v
         +-----------+-----------+                           +-----------+-----------+
         | Local Compute Providers |                           | Cloud Gateway (Secure)|
         | (Ollama, llama.cpp,    |                           | (Google Gemini, AWS)  |
         |  Whisper.cpp)         |                           | * API key isolation   |
         +-----------------------+                           +-----------------------+
```

### 2.1. Local Filesystem Isolation
* **Least Privilege**: The local Node runtime runs with user-level privileges, preventing it from touching system directories (such as Windows Registry or Linux systemd) without explicit OS-level prompt elevation.
* **Workspace Boundaries**: The local indexer only scans files in directory trees explicitly loaded by the user as an active workspace.

### 2.2. Secret Key Isolation
* API keys are loaded directly into process memory or stored inside standard encrypted keychain stores.
* Secret values are **never** injected into the compiled client-side JavaScript or exposed in console logging arrays.

## 3. Defense Against Agent Exploits (Aider/Claude Code Style)
Autonomous coding agents are susceptible to prompt injection, where malicious repository code can instruct the agent to run destructive shell commands. QEVRYN mitigates this with an Active Defensive Shell:
* **String Parser Filter**: All proposed command blocks are audited against a strict, regularly compiled blacklist including destructive patterns (`rm -rf`, `mkfs`, `del /s`, etc.).
* **Consent Gates**: No shell command or file edit is ever performed silently. Every action must be previewed via a detailed Markdown visual diff and requires direct user authorization.

## 4. SSRF & Ingress Protection
* QEVRYN binds its local server exclusively to `127.0.0.1` or authorized container gateways.
* Incoming network connections are filtered, blocking cross-site scripting (XSS) and cross-site request forgery (CSRF) via strict CORS policies and dynamic session tokens.

---
*Maintained with an elite security posture by Veeomdecoders.*
