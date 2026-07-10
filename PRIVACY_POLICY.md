# QEVRYN Privacy Policy
**Effective Date**: July 2026  
**Branding**: Built by Veeomdecoders

At QEVRYN, we believe your data belongs to you. This Privacy Policy outlines our strict offline-by-default standard and how we protect your personal files, conversations, memory, and codebases.

## 1. Core Privacy Rule: Offline-by-Default
* QEVRYN does **not** collect, store, or transmit your private chats, documents, scanned code, database records, or memory to any remote server by default.
* Your local SQLite database, vector index, configuration variables, and chat histories are saved solely on your local storage drive.

## 2. Consent-Based Network Access
* **Local Mode**: Totally offline. No network requests are initiated for processing your queries.
* **Hybrid Mode**: Contacts secure external APIs (such as Google Gemini) ONLY when local reasoning models require remote lookup AND you have granted permission.
* **Online Mode**: Uses web search grounding only when specified. Selected context fragments are transmitted to the LLM backend strictly as required, with zero silent background uploading.

## 3. Persistent Local Memory Control
* All personalized memory resides inside your local browser storage or local folder directory.
* You have absolute control to:
  * View every stored memory fact and preference.
  * Edit or delete individual records.
  * Trigger a "Full Memory Wipe" to immediately erase all context.

## 4. Telemetry and Usage Diagnostics
* Telemetry is **OFF** by default. No hidden telemetry, crash reports, or performance metrics are sent unless you toggle the telemetry checkbox in the Settings panel.
* If enabled, telemetry only transmits generalized system metrics (such as average prompt latency or active hardware accelerator) and never sends private text, keys, filenames, or prompts.

## 5. Security & Encryption
* Local model directories and RAG indexes can be encrypted via standard OS-level directory encryption.
* QEVRYN enforces Least Privilege execution, meaning it cannot access folders outside your active workspace directory without manual folder permission gates.

---
*Your laptop, your data. Built by Veeomdecoders.*
