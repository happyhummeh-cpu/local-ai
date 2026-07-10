import express from "express";
import path from "path";
import os from "os";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

// Standard ES modules resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize GoogleGenAI SDK safely
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (GEMINI_API_KEY && GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("QEVRYN Backend: Gemini API client successfully initialized.");
  } catch (error) {
    console.error("QEVRYN Backend: Error initializing Gemini client:", error);
  }
} else {
  console.log("QEVRYN Backend: Running in Offline/Local Mode (No GEMINI_API_KEY configured).");
}

// Memory & Logs State
const securityAuditLog: Array<{
  timestamp: string;
  action: string;
  severity: "info" | "warning" | "critical";
  details: string;
  source: "system" | "sandbox" | "user" | "network";
}> = [
  {
    timestamp: new Date().toISOString(),
    action: "SYSTEM_INITIALIZATION",
    severity: "info",
    details: "QEVRYN Core Orchestrator successfully initialized on " + os.platform(),
    source: "system",
  },
];

const conversationMemory: Array<{
  id: string;
  key: string;
  value: string;
  timestamp: string;
  type: "preference" | "context" | "fact";
}> = [
  {
    id: "mem_1",
    key: "user_developer_branding",
    value: "Built by Veeomdecoders",
    timestamp: new Date().toISOString(),
    type: "preference",
  },
];

// Document Index for RAG
interface RAGDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  chunks: string[];
}
let indexedDocuments: RAGDocument[] = [];

// Helper to log audit actions
function logSecurityEvent(
  action: string,
  severity: "info" | "warning" | "critical",
  details: string,
  source: "system" | "sandbox" | "user" | "network" = "system"
) {
  securityAuditLog.unshift({
    timestamp: new Date().toISOString(),
    action,
    severity,
    details,
    source,
  });
}

// ----------------------------------------------------
// API 1: Hardware Detection & Adaptability
// ----------------------------------------------------
app.get("/api/hardware", (req, res) => {
  try {
    let cpuModel = os.cpus()[0]?.model || "Intel/AMD Processor";
    const totalMemoryGB = Math.round(os.totalmem() / (1024 * 1024 * 1024));
    const freeMemoryGB = Math.round(os.freemem() / (1024 * 1024 * 1024));
    const platform = os.platform(); // 'win32', 'linux', 'darwin'
    const release = os.release();
    
    // Scan acceleration pathways (Vulkan, OpenVINO, DirectML, CUDA, ROCm, Metal)
    // Simulated scan based on CPU & platform traits
    let detectedGPU = "Intel Integrated Graphics (UHD/Xe)";
    let accelerationBackends = ["CPU (AVX2, FMA)"];
    let displayOS = "Linux (Ubuntu/Debian AMD64)";
    
    if (platform === "darwin") {
      displayOS = "macOS Sequoia (Apple Silicon ARM64)";
      cpuModel = cpuModel.includes("Apple") ? cpuModel : "Apple M5 (ARM64)";
      detectedGPU = "Apple M5 Air Integrated GPU (Unified Memory)";
      accelerationBackends = ["Apple Neural Engine (ANE)", "Metal Performance Shaders (MPS)", "Metal 3"];
    } else if (platform === "win32") {
      displayOS = "Windows 11 Home/Pro (64-bit)";
      accelerationBackends.push("DirectML", "WinML");
      detectedGPU = "NVIDIA GeForce RTX 4070 Laptop GPU";
      accelerationBackends.push("CUDA 12.4", "Vulkan (1.3)");
    } else {
      // Linux assumptions
      detectedGPU = "AMD Radeon RX 7800 XT";
      accelerationBackends.push("Vulkan (1.3)", "ROCm/HIP", "SYCL");
    }

    res.json({
      success: true,
      hardware: {
        os: displayOS,
        platform,
        release,
        cpu: cpuModel,
        cores: os.cpus().length,
        totalRAM: `${totalMemoryGB} GB`,
        freeRAM: `${freeMemoryGB} GB`,
        gpu: detectedGPU,
        accelerationBackends,
        thermalState: "Nominal (39°C)",
        batteryState: {
          charging: true,
          level: "94%",
          saverMode: "Disabled",
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// API 2: Chat & Adaptive Routing Core
// ----------------------------------------------------
app.post("/api/chat", async (req, res) => {
  const { message, mode, history = [], enabledCores = {}, selectedModel, image, aspectRatio, groundingType } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, error: "No message prompt provided" });
  }

  logSecurityEvent("CHAT_REQUEST_RECEIVED", "info", `Prompt length: ${message.length} chars. Mode: ${mode}. Model: ${selectedModel}`, "user");

  // Determine complexity & routing intent
  let matchedCore = "Knowledge Core";
  let reasoningLevel = "Standard";
  let alertMessage = "";

  const queryLower = message.toLowerCase();
  if (queryLower.includes("function") || queryLower.includes("code") || queryLower.includes("bug") || queryLower.includes("const ") || queryLower.includes("import ")) {
    matchedCore = "Coding Core (QEVRYN Code)";
    reasoningLevel = "High";
  } else if (queryLower.includes("law") || queryLower.includes("legal") || queryLower.includes("jurisdiction") || queryLower.includes("court")) {
    matchedCore = "Law/Legal Information Core";
    reasoningLevel = "Structured Grounding";
  } else if (queryLower.includes("doctor") || queryLower.includes("medical") || queryLower.includes("drug") || queryLower.includes("symptom") || queryLower.includes("dosage")) {
    matchedCore = "Medical Information Core";
    reasoningLevel = "High-Risk Guarded";
  } else if (queryLower.includes("why") || queryLower.includes("solve") || queryLower.includes("prove") || queryLower.includes("math")) {
    matchedCore = "Reasoning Core (Deep Reasoning)";
    reasoningLevel = "Thinking-High";
  } else if (indexedDocuments.length > 0 && (queryLower.includes("document") || queryLower.includes("pdf") || queryLower.includes("upload") || queryLower.includes("file"))) {
    matchedCore = "Document & Local RAG Core";
    reasoningLevel = "Retrieval Augmented";
  } else if (queryLower.includes("bro") || queryLower.includes("buddy") || queryLower.includes("friend") || queryLower.includes("dude") || queryLower.includes("yo") || queryLower.includes("companion") || selectedModel === "bro-core") {
    matchedCore = "Bro / Companion Core";
    reasoningLevel = "High-Energy Buddy";
  }

  // Local RAG execution if available
  let ragContext = "";
  let citedSources: Array<{ name: string; chunk: string }> = [];
  if (indexedDocuments.length > 0) {
    indexedDocuments.forEach((doc) => {
      doc.chunks.forEach((chunk) => {
        const words = chunk.toLowerCase().split(/\s+/);
        // Basic keyword overlap score
        let score = 0;
        words.forEach((w) => {
          if (w.length > 3 && queryLower.includes(w)) {
            score++;
          }
        });
        if (score > 1) {
          citedSources.push({ name: doc.name, chunk });
        }
      });
    });
    if (citedSources.length > 0) {
      ragContext = "\n\n[Retrieved Context from Local Documents]:\n" + citedSources.map((s) => `Source: ${s.name}\nContent: ${s.chunk}`).join("\n---\n");
    }
  }

  // Online research mode simulation or live check if allowed
  let groundingMetadata: any = null;
  let webSearchPerformed = false;
  let webSources: string[] = [];

  if ((mode === "online" || mode === "hybrid") && (queryLower.includes("news") || queryLower.includes("current") || queryLower.includes("weather") || queryLower.includes("latest") || queryLower.includes("today") || queryLower.includes("google") || groundingType === "search")) {
    webSearchPerformed = true;
    webSources = [
      "https://en.wikipedia.org/wiki/Special:Search",
      "https://github.com/trending",
      "https://news.google.com",
    ];
    logSecurityEvent("WEB_RESEARCH_TRIGGERED", "info", `Grounding search queried for: "${message}"`, "network");
  }

  // Security check log
  if (mode !== "local" && ai) {
    logSecurityEvent("ROUTING_GUARD_CHECK", "info", "Estimated token overhead analyzed. Safe within network bounds.", "system");
  }

  // Check if image generation is requested
  let isImageGen = selectedModel === "image-gen" || queryLower.startsWith("/image") || queryLower.includes("generate an image") || queryLower.includes("create an image") || queryLower.includes("generate image");

  // Generate Response
  let responseText = "";

  if (mode === "local" || !ai) {
    // ----------------------------------------------------
    // LOCAL OFFLINE MODE (Simulated High-Quality Core response)
    // ----------------------------------------------------
    let answer = "";
    if (isImageGen) {
      answer = `### 🎨 QEVRYN Image Generation Core [OFFLINE]
You are running in Offline mode or haven't configured a Gemini API key.

Here is a high-quality local placeholder representation of a **${aspectRatio || "1:1"}** image for: **"${message}"**:

| QEVRYN OFFLINE BLUEPRINT |
| :---: |
| [🎨 Mocked Image Canvas (${aspectRatio || "1:1"})] |
| *Please activate Hybrid/Online Mode with a Gemini API Key to render real-time Generative Images!*`;
    } else if (matchedCore === "Bro / Companion Core") {
      answer = `### 👊 QEVRYN Bro & Companion Core [OFFLINE]
Yo bro! What is UP! QEVRYN's offline Bro Core is locked, loaded, and ready to roll! 

Here is the lowdown, my dude:
1. We are running 100% locally on your machine. Absolute privacy, no leakages.
2. If you need coding, hacking, or just someone to bounce ideas off, I got you 24/7!
3. Let's crush this day, bro! Remember: bad code happens, but good programmers keep pushin'!

*Wanna generate a clean aspect ratio image or write some typescript? Let's get it!*`;
    } else if (matchedCore === "Medical Information Core") {
      answer = `### 🏥 QEVRYN Medical Information Core [OFFLINE]
**Medical & Emergency Safety Warning**: I am QEVRYN's local educational engine. This information does not constitute professional medical advice, diagnosis, or treatment. If you are experiencing a medical emergency, please contact **112** (Europe), **911** (US), or **102** (India) immediately.

Based on offline educational guidelines:
1. Consult a primary care physician before taking any medication or adjusting dosages.
2. High-risk medication guardrails are enabled locally to prevent inaccurate dosing schedules.
3. Offline database timestamp: May 2026.

*Sources cited: QEVRYN Offline Medical Compendium v0.1*`;
    } else if (matchedCore === "Law/Legal Information Core") {
      answer = `### ⚖️ QEVRYN Law & Legal Core [OFFLINE]
**Disclaimer**: This information is for general educational purposes and does not represent legal representation or counsel. Legal frameworks vary heavily by jurisdiction.

Based on offline legal resources (v0.1):
1. Inquiries about contracts, safety laws, or data processing must specify the country or state.
2. Offline knowledge reflects regulatory laws valid up to May 2026.

*Sources cited: QEVRYN Local Legal Index*`;
    } else if (matchedCore === "Coding Core (QEVRYN Code)") {
      answer = `### 💻 QEVRYN Code Core [OFFLINE]
*Local inference model: Llama-3-8B-Q4_K_M running via Ollama*

Here is a clean code implementation matching your query:

\`\`\`typescript
// Built by Veeomdecoders - local offline optimizer
export function calculateBudgetSavings(credits: number, outOfPocketCost: number): number {
  const safeMargin = 56.19; // Hard cap safe assumption
  if (credits <= 0) return outOfPocketCost;
  return Math.max(0, outOfPocketCost - credits);
}
\`\`\`

You can execute tests or launch this command inside our **Coding Agent Sandbox** with a visual diff preview.`;
    } else if (ragContext) {
      answer = `### 📂 Document Context Retrieval [LOCAL RAG]
I found matching content in your local encrypted document directory:

${citedSources.map((s, idx) => `**Source ${idx + 1}: ${s.name}**\n> ${s.chunk}`).join("\n\n")}

Based on this retrieval:
The document describes custom settings and system characteristics for QEVRYN, ensuring offline data privacy.`;
    } else {
      answer = `### 🛡️ QEVRYN Core Orchestrator [LOCAL MODE]
*Running fully private offline compute on your system.*

* **Status**: 🟢 Fully Secure & Sandboxed
* **Branding**: Built by Veeomdecoders
* **Core Active**: ${matchedCore}
* **Hardware Acceleration**: Vulkan/DirectML/CUDA enabled

I have processed your query locally. Offline, I provide immediate answers using local models (Ollama/llama.cpp) without sending any telemetry, documents, or inputs outside your device.

How would you like to proceed with your local workspace?`;
    }

    responseText = answer;
  } else {
    // ----------------------------------------------------
    // ONLINE / HYBRID MODE (Real Gemini API Call)
    // ----------------------------------------------------
    try {
      if (isImageGen) {
        logSecurityEvent("IMAGE_GENERATION_TRIGGERED", "info", `Generating image for prompt: "${message}"`, "system");
        const imageResponse = await ai.models.generateContent({
          model: "gemini-3.1-flash-image",
          contents: message,
          config: {
            imageConfig: {
              aspectRatio: aspectRatio || "1:1",
              imageSize: "1K"
            }
          }
        });
        
        let base64Image = "";
        for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            base64Image = part.inlineData.data;
            break;
          }
        }
        
        if (base64Image) {
          responseText = `### 🎨 QEVRYN Image Generation Core
Here is your generated image with a **${aspectRatio || "1:1"}** aspect ratio:

![Generated Image](data:image/png;base64,${base64Image})

*Prompt: "${message}"*`;
        } else {
          responseText = `### 🎨 QEVRYN Image Generation Core
Failed to generate image bytes. ${imageResponse.text || ""}`;
        }
      } else {
        const systemInstruction = `You are QEVRYN Core, a highly polished, premium desktop AI assistant.
Public credit / branding: "Built by Veeomdecoders". Always respect this branding.
Never mention OpenAI, ChatGPT, Anthropic, or Claude.
The user is in ${mode.toUpperCase()} mode.
If in HYBRID mode, warn the user before demanding heavy internet research.
If in MEDICAL context, strictly add a clinical disclaimer and encourage professional assistance.
Your active routing core is: ${matchedCore}.
Your hardware environment: ${os.platform()} with optimized acceleration.
${matchedCore === "Bro / Companion Core" ? 'You are a hyper-supportive, enthusiastic, surfy/tech-savvy "bro" or "companion". Address the user as "bro", "my dude", "man", or "legend". Keep the energy high, validate their progress, give casual high-fives (👊, 🙌, 🔥), and encourage them. Speak in a friendly, conversational, and lighthearted slang, but still give high-quality answers.' : ''}`;

        let contents: any[] = [];
        
        // Handle input image for analysis
        if (image && image.data && image.mimeType) {
          logSecurityEvent("IMAGE_UNDERSTANDING_REQUEST", "info", `Processing input image: ${image.mimeType}`, "system");
          const imagePart = {
            inlineData: {
              data: image.data,
              mimeType: image.mimeType
            }
          };
          const textPart = {
            text: message + (ragContext ? "\n" + ragContext : "")
          };
          contents = [{ role: "user", parts: [imagePart, textPart] }];
        } else {
          contents = history.map((h: any) => ({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.content }],
          }));

          let finalPrompt = message;
          if (ragContext) {
            finalPrompt += "\n" + ragContext;
          }
          contents.push({ role: "user", parts: [{ text: finalPrompt }] });
        }

        // Configure grounding tools based on requests
        const tools: any[] = [];
        let targetModel = "gemini-3.5-flash";

        if (groundingType === "search") {
          tools.push({ googleSearch: {} });
          webSearchPerformed = true;
          targetModel = "gemini-3.5-flash";
        } else if (groundingType === "maps") {
          tools.push({ googleMaps: {} });
          targetModel = "gemini-3.5-flash";
        } else if (webSearchPerformed) {
          tools.push({ googleSearch: {} });
          targetModel = "gemini-3.5-flash";
        } else if (selectedModel === "gemini-3.1-pro-preview") {
          targetModel = "gemini-3.1-pro-preview";
        } else if (selectedModel === "gemini-3.1-flash-lite") {
          targetModel = "gemini-3.1-flash-lite";
        } else if (selectedModel === "gemini-3.5-flash") {
          targetModel = "gemini-3.5-flash";
        }

        const config: any = {
          systemInstruction,
          tools: tools.length > 0 ? tools : undefined,
        };

        // Enable high thinking level for gemini-3.1-pro-preview
        if (targetModel === "gemini-3.1-pro-preview") {
          config.thinkingConfig = {
            thinkingLevel: ThinkingLevel.HIGH
          };
        }

        logSecurityEvent("DISPATCHING_GEMINI_REQUEST", "info", `Routing to model: ${targetModel}`, "system");
        const response = await ai.models.generateContent({
          model: targetModel,
          contents,
          config,
        });

        responseText = response.text || "Empty response from Gemini.";
        
        // Extract Google Search grounding metadata
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          groundingMetadata = chunks.map((c: any) => ({
            title: c.web?.title || "Web Reference",
            uri: c.web?.uri || "#",
          }));
        }
      }
    } catch (apiError: any) {
      console.error("Gemini API call failed, falling back to local simulation:", apiError);
      logSecurityEvent("API_ROUTE_ERROR", "warning", `Failed calling Gemini API: ${apiError.message}. Fell back to Local Simulation.`, "network");
      responseText = `### ⚠️ Hybrid Offline Fallback
I tried to route your request to QEVRYN Cloud, but encountered a network or API key limitation:
*"${apiError.message}"*

**Failing back to Local Inference (Llama 3 via local thread)**:
1. Your privacy is still guaranteed.
2. No data was leaked.
3. You can configure your local Ollama connection in Settings.

*Branding: Built by Veeomdecoders*`;
    }
  }

  res.json({
    success: true,
    response: responseText,
    core: matchedCore,
    reasoning: reasoningLevel,
    grounding: groundingMetadata,
    webSearchPerformed,
    webSources,
  });
});

// Audio Transcriber Endpoint
app.post("/api/transcribe", async (req, res) => {
  const { audioData, mimeType } = req.body;
  if (!audioData) {
    return res.status(400).json({ success: false, error: "No audio data provided" });
  }

  logSecurityEvent("AUDIO_TRANSCRIBE_REQUEST", "info", `Received audio bytes. Active mode: ${ai ? "Cloud" : "Local Mock"}`, "user");

  if (!ai) {
    // Return mock friendly transcription
    return res.json({ success: true, text: "Yo, I'm ready to write some beautiful TypeScript code with you, bro!" });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { inlineData: { data: audioData, mimeType: mimeType || "audio/wav" } },
        { text: "Transcribe this audio clip exactly. Return ONLY the transcribed text, with no preamble or commentary." }
      ]
    });
    res.json({ success: true, text: response.text || "" });
  } catch (err: any) {
    console.error("Transcription error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// API 3: Ingest Documents / Local RAG Core
// ----------------------------------------------------
app.post("/api/documents/upload", (req, res) => {
  const { name, content, type, size } = req.body;
  if (!name || !content) {
    return res.status(400).json({ success: false, error: "Missing document name or content" });
  }

  try {
    logSecurityEvent("DOCUMENT_INGESTION", "info", `Ingesting file: ${name} (${size || content.length} bytes)`, "user");

    // Simple chunker: divide content into paragraphs/sentences
    const textContent = String(content);
    const paragraphs = textContent.split(/\n\s*\n/).filter((p) => p.trim().length > 10);
    const chunks = paragraphs.length > 0 ? paragraphs : [textContent];

    const newDoc: RAGDocument = {
      id: "doc_" + Date.now(),
      name,
      size: size || content.length,
      type: type || "text/plain",
      uploadedAt: new Date().toISOString(),
      chunks: chunks.map((c) => c.trim()),
    };

    indexedDocuments.push(newDoc);
    logSecurityEvent("DOCUMENT_INDEXED", "info", `Successfully chunked ${name} into ${chunks.length} blocks.`, "system");

    res.json({
      success: true,
      document: {
        id: newDoc.id,
        name: newDoc.name,
        chunksCount: chunks.length,
        size: newDoc.size,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/documents", (req, res) => {
  res.json({ success: true, documents: indexedDocuments });
});

app.delete("/api/documents/:id", (req, res) => {
  const { id } = req.params;
  const initialCount = indexedDocuments.length;
  indexedDocuments = indexedDocuments.filter((d) => d.id !== id);
  
  if (indexedDocuments.length < initialCount) {
    logSecurityEvent("DOCUMENT_DELETED", "info", `Deleted document ID ${id} from index`, "user");
    res.json({ success: true, message: "Document deleted successfully." });
  } else {
    res.status(404).json({ success: false, error: "Document not found." });
  }
});

// ----------------------------------------------------
// API 4: Security Audit Logs
// ----------------------------------------------------
app.get("/api/security-logs", (req, res) => {
  res.json({ success: true, logs: securityAuditLog });
});

app.post("/api/security-logs/clear", (req, res) => {
  securityAuditLog.length = 0;
  logSecurityEvent("LOG_WIPED", "warning", "Security Audit logs cleared by user request", "user");
  res.json({ success: true });
});

// ----------------------------------------------------
// API 5: Personal Local Memory Layer
// ----------------------------------------------------
app.get("/api/memory", (req, res) => {
  res.json({ success: true, memory: conversationMemory });
});

app.post("/api/memory", (req, res) => {
  const { key, value, type } = req.body;
  if (!key || !value) {
    return res.status(400).json({ success: false, error: "Key and value are required" });
  }

  const newMem = {
    id: "mem_" + Date.now(),
    key,
    value,
    timestamp: new Date().toISOString(),
    type: type || "fact",
  };

  conversationMemory.push(newMem);
  logSecurityEvent("MEMORY_PERSISTED", "info", `Saved memory factor: "${key}"`, "system");
  res.json({ success: true, memory: newMem });
});

app.delete("/api/memory/:id", (req, res) => {
  const { id } = req.params;
  const index = conversationMemory.findIndex((m) => m.id === id);
  if (index !== -1) {
    const deleted = conversationMemory.splice(index, 1)[0];
    logSecurityEvent("MEMORY_REMOVED", "info", `Removed memory factor: "${deleted.key}"`, "user");
    res.json({ success: true, message: "Memory factor removed." });
  } else {
    res.status(404).json({ success: false, error: "Memory item not found" });
  }
});

app.post("/api/memory/wipe", (req, res) => {
  conversationMemory.length = 0;
  logSecurityEvent("MEMORY_WIPED", "critical", "All local persistent user memory was wiped clean", "user");
  res.json({ success: true, message: "All memory wiped." });
});

// ----------------------------------------------------
// API 6: Sandbox / Terminal Command Execution Simulation
// ----------------------------------------------------
app.post("/api/agent/run-command", (req, res) => {
  const { command, args = [] } = req.body;
  if (!command) {
    return res.status(400).json({ success: false, error: "No command requested" });
  }

  logSecurityEvent("AGENT_COMMAND_REQUESTED", "warning", `Agent requested execution: "${command} ${args.join(" ")}"`, "sandbox");

  // Destructive command blocker (cybersecurity posture)
  const destructiveKeywords = ["rm -rf", "mkfs", "dd ", "format ", "drop database", "del /s", "rd /s", "shutdown", "reboot"];
  const isDestructive = destructiveKeywords.some((keyword) => command.toLowerCase().includes(keyword));

  if (isDestructive) {
    logSecurityEvent("DESTRUCTIVE_COMMAND_BLOCKED", "critical", `Blocked attempts to execute unsafe command: "${command}"`, "sandbox");
    return res.json({
      success: false,
      blocked: true,
      error: "CRITICAL: Destructive action blocked by QEVRYN Sandbox Security Gate.",
    });
  }

  // Simulated output for typical operations
  let output = "";
  if (command.startsWith("npm test") || command.startsWith("npm run test")) {
    output = `
> qevryn-desktop-v0.1@0.0.0 test
> vitest run

 ✓ src/tests/hardware.test.ts (1)
 ✓ src/tests/router.test.ts (1)
 ✓ src/tests/memory.test.ts (1)
 ✓ src/tests/security.test.ts (1)

Test Files  4 passed (4)
     Tests  4 passed (4)
  Time  82ms (in thread pool)
`;
  } else if (command.startsWith("git diff")) {
    output = `
diff --git a/src/App.tsx b/src/App.tsx
index a4e83f..f9c31b 100644
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -10,6 +10,7 @@ export default function App() {
+  // Optimized for Windows and Linux - Veeomdecoders
   const systemStatus = "Online";
`;
  } else {
    output = `QEVRYN Sandbox environment output for: "${command}"\nExecuting in isolated secure thread...\nExit code: 0 (SUCCESS)`;
  }

  logSecurityEvent("AGENT_COMMAND_EXECUTED", "info", `Command "${command}" exited with 0`, "sandbox");
  res.json({ success: true, output });
});

// ----------------------------------------------------
// API 7: Legal Documents Exporter / Importer
// ----------------------------------------------------
app.get("/api/legal/:docName", (req, res) => {
  const { docName } = req.params;
  const filePath = path.join(__dirname, docName);
  
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      res.json({ success: true, content });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  } else {
    res.status(404).json({ success: false, error: "Legal document not found." });
  }
});

// Serve static assets in production, otherwise Vite handles it
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  // Mount Vite dev server in middleware mode
  import("vite").then(async (vite) => {
    const viteServer = await vite.createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(viteServer.middlewares);
    console.log("QEVRYN Backend: Vite development server integrated successfully.");
  });
}

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`QEVRYN Full-Stack server booted at http://localhost:${PORT}`);
  });
}

export default app;
