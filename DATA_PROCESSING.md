# QEVRYN Data Processing Agreement (DPA)
**Effective Date**: July 2026  
**Branding**: Built by Veeomdecoders

This document outlines the strict technical processing pipeline for user data inside QEVRYN.

## 1. Local Processing Pipeline
Any files, folders, or repositories you feed into QEVRYN are processed according to this pipeline:
1. **Ingestion**: File formats (.pdf, .docx, .txt, .md) are read from your disk into volatile system memory.
2. **Parsing**: Text elements are extracted, and structural headings/tables are structured.
3. **Chunking**: Text is split into overlapping logical paragraphs (average chunk size: 500 characters) to ensure context preservation.
4. **Vector Embeddings**: Realized via local embeddings models (e.g., `gemini-embedding-2-preview` when online is active, or local models in Ollama).
5. **Local Vector Database**: Chunks and embeddings are indexed using a lightweight local key-value or vector system stored on your device.

## 2. Document Access and Workspace Bound
* QEVRYN cannot scan your entire hard drive. It can only read directories and files that you explicitly drag-and-drop or select as the active "Coding Workspace".
* You can purge the active document index at any time by clicking the "Purge Index" button inside the Documents panel, which wipes the database chunks immediately.

## 3. Remote Cloud Interactions
* If you enable Hybrid/Online mode and submit a prompt, only relevant context snippets retrieved from your local document index are sent as prompt additions to Google Gemini.
* These requests are protected by Google's standard developer API privacy terms and are not used to train public foundation models.

---
*Built with professional grade data boundaries by Veeomdecoders.*
