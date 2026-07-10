# QEVRYN Security Policy
**Version**: 1.0  
**Publisher**: Built by Veeomdecoders

We take cybersecurity extremely seriously. This document outlines how we secure the QEVRYN desktop application, our vulnerability reporting procedures, and details of our sandboxed execution architecture.

## 1. Vulnerability Reporting & Disclosure
If you find a security vulnerability in QEVRYN, please do not file a public GitHub issue. Instead, report it privately to our development team:
* **Reporting Channel**: Email **happyhummeh@gmail.com** (or through the security panel inside the desktop UI).
* **Response SLA**: We will acknowledge receipt of your report within 48 hours and provide a fix or mitigation plan within 7 days.

## 2. Secure Coding Agent Sandbox
To prevent arbitrary destructive command execution or prompt injection-induced shell damage (e.g., Aider-style agent loop exploits), QEVRYN implements multiple protective boundaries:
* **SSRF Protection**: Limits local agent requests from hitting internal container ports or local routers unless explicitly whitelisted.
* **Command Validation Gate**: All console/PowerShell commands are analyzed for unsafe keywords (e.g., `rm -rf`, `mkfs`, `dd`, `format`, `del /s`, `drop database`). Unsafe commands are blocked instantly, and flagged in the Security Audit Log.
* **Visual Diff Gates**: The agent must display a visual file diff before modifying any workspace files, requiring user manual confirmation.

## 3. Model Verification & Integrity
* All downloadable model packs are verified using **SHA-256 checksums** before loading into the inference thread.
* If a model checksum does not match its official signature, loading is cancelled immediately, and an audit warning is generated.

## 4. Local Cryptographic Isolation
* API keys (such as `GEMINI_API_KEY`) are kept in the operating system's environment memory or encrypted config file. They are never sent to external services other than the direct official Google endpoint, and are never exposed in browser developer tools or log outputs.

---
*Maintained with absolute safety in mind by Veeomdecoders.*
