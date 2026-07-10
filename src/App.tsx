import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  Activity,
  Cpu,
  Terminal,
  Database,
  Download,
  BookOpen,
  Trash2,
  Mic,
  Volume2,
  AlertTriangle,
  FileText,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Check,
  Code,
  Layout,
  ExternalLink,
  Lock,
  BatteryCharging,
  DollarSign,
  ChevronRight,
  HardDrive,
  Info,
  X,
  Image as ImageIcon,
  Globe,
  MapPin,
  Sparkles,
  Menu,
  ChevronLeft,
  Flame,
  Send
} from "lucide-react";

// Definitions matching server structures
interface HardwareInfo {
  os: string;
  platform: string;
  release: string;
  cpu: string;
  cores: number;
  totalRAM: string;
  freeRAM: string;
  gpu: string;
  accelerationBackends: string[];
  thermalState: string;
  batteryState: {
    charging: boolean;
    level: string;
    saverMode: string;
  };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  core?: string;
  reasoning?: string;
  grounding?: Array<{ title: string; uri: string }>;
  timestamp: string;
}

interface SecurityLog {
  timestamp: string;
  action: string;
  severity: "info" | "warning" | "critical";
  details: string;
  source: "system" | "sandbox" | "user" | "network";
}

interface PersonalMemory {
  id: string;
  key: string;
  value: string;
  timestamp: string;
  type: "preference" | "context" | "fact";
}

interface RAGDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  chunksCount?: number;
  chunks: string[];
}

// Full text legal documents dictionary
const legalDocs: Record<string, string> = {
  "TERMS_OF_SERVICE.md": `# QEVRYN Terms of Service
**Version**: 0.1-Beta  
**Publisher/Builder**: Built by Veeomdecoders

Welcome to QEVRYN, a premium local-first AI operating system designed for Windows and Linux laptops and desktops. By installing or executing QEVRYN, you agree to these terms:
1. **Local-First Architecture**: Your chats, private files, codebase indices, and memory stay fully on your laptop.
2. **No Warranties**: Provided "AS-IS" with zero out-of-pocket costs targeted.
3. **Clinical & Law Disclaimers**: Cores are strictly educational. Direct professional reviews are mandatory.
`,
  "PRIVACY_POLICY.md": `# QEVRYN Privacy Policy
**Version**: 0.1-Beta  
**Publisher/Builder**: Built by Veeomdecoders

Your privacy is our core design vector.
1. **Offline by Default**: Chats are processed purely via CPU/GPU local instructions.
2. **Permission Gates**: Document indices are shared only when whitelisted in Hybrid or Online mode.
3. **Sovereign Memory**: You have absolute control to inspect, export, edit, or wipe all memories.
`,
  "SECURITY_WHITEPAPER.md": `# QEVRYN Cybersecurity Whitepaper
**Security Architecture & Threat Mitigation Framework**  
**Author**: Built by Veeomdecoders

Technical details on our strict security boundaries:
1. **Process Boundary**: Binds backend microservers to loopback ports (127.0.0.1) inside isolated sandboxes.
2. **Active Sandbox**: Regulates shell execution, blocking RM -RF or destructive injections instantly.
3. **Secrets Isolation**: API keys are isolated in standard OS secure memory and never shared with logs.
`,
  "MEDICAL_LEGAL_DISCLAIMER.md": `# QEVRYN Medical & Legal Disclaimer
**Date**: July 2026  
**Publisher/Builder**: Built by Veeomdecoders

1. **Medical Context**: Educational summaries only. In emergencies, seek licensed physical intervention immediately (dial 112/911/102).
2. **Legal Context**: Jurisdictions change. Documents or contract outlines are educational frameworks only. Always have local legal representation verify prior to execution.
`
};

export default function App() {
  // Application State
  const [activeTab, setActiveTab] = useState<"workspace" | "sandbox" | "rag" | "memory" | "logs" | "legal">("workspace");
  const [mode, setMode] = useState<"local" | "hybrid" | "online">("local");
  const [hardware, setHardware] = useState<HardwareInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  
  // Settings & Configuration
  const [perfMode, setPerfMode] = useState<"battery" | "balanced" | "performance" | "max">("balanced");
  const [activeModel, setActiveModel] = useState("Llama-3-8B-Instruct (Local)");
  const [telemetry, setTelemetry] = useState(false);
  const [cloudBudgetLimit, setCloudBudgetLimit] = useState(56.19); // ap-south-1 credit pool
  const [cloudSpendEst, setCloudSpendEst] = useState(0.0);

  // RAG Ingestion
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [uploadName, setUploadName] = useState("");
  const [uploadContent, setUploadContent] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  
  // Memory management
  const [memories, setMemories] = useState<PersonalMemory[]>([]);
  const [newMemKey, setNewMemKey] = useState("");
  const [newMemVal, setNewMemVal] = useState("");
  const [newMemType, setNewMemType] = useState<"preference" | "context" | "fact">("fact");

  // Coding Sandbox Sandbox
  const [sandboxCommand, setSandboxCommand] = useState("git status");
  const [sandboxOutput, setSandboxOutput] = useState("");
  const [sandboxFiles, setSandboxFiles] = useState([
    { path: "src/App.tsx", status: "Modified" },
    { path: "server.ts", status: "Indexed" },
    { path: "package.json", status: "Unchanged" }
  ]);
  const [visualDiffOpen, setVisualDiffOpen] = useState(false);
  const [sandboxSecurityWarning, setSandboxSecurityWarning] = useState<string | null>(null);

  // Security Audit state
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<"all" | "info" | "warning" | "critical">("all");

  // Legal Trust State
  const [selectedLegalDoc, setSelectedLegalDoc] = useState("TERMS_OF_SERVICE.md");
  const [legalContent, setLegalContent] = useState("");

  // Installer simulation state
  const [targetPlatform, setTargetPlatform] = useState<"windows" | "linux" | "macos">("macos");
  const [installerStatus, setInstallerStatus] = useState<"idle" | "building" | "completed">("idle");
  const [installerProgress, setInstallerProgress] = useState(0);
  const [generatedChecksum, setGeneratedChecksum] = useState("");
  const [buildLogs, setBuildLogs] = useState<string[]>([]);

  // macOS specific packaging configs
  const [macFormat, setMacFormat] = useState<"dmg" | "app" | "pkg">("dmg");
  const [macArch, setMacArch] = useState<"m_series" | "universal" | "intel">("m_series");
  const [macAccel, setMacAccel] = useState<"metal" | "cpu">("metal");
  const [macSigning, setMacSigning] = useState<"notarized" | "ad_hoc">("notarized");

  // Speech simulation state
  const [isListening, setIsListening] = useState(false);
  const [speechOutput, setSpeechOutput] = useState("");
  const [activeVoice, setActiveVoice] = useState("Kore (Cheer)");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Claude/ChatGPT styled and Gemini Feature States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [groundingType, setGroundingType] = useState<"none" | "search" | "maps">("none");
  const [uploadedImage, setUploadedImage] = useState<{ data: string; mimeType: string; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Real Audio Recorder States
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load initial settings and trigger scan
  useEffect(() => {
    fetchHardware();
    fetchLogs();
    fetchDocuments();
    fetchMemories();
    loadLegalDoc("TERMS_OF_SERVICE.md");

    // Welcome message
    setMessages([
      {
        id: "wel_1",
        role: "assistant",
        content: `### 👋 Welcome to QEVRYN v0.1 Desktop\n\nQEVRYN is an **offline-first intelligence layer and local operating system** for macOS, Windows, & Linux desktops.\n\n* **Branding**: Built by Veeomdecoders\n* **Current Mode**: \`Local (Fully Offline)\`\n* **Status**: 🟢 Safe and private. Your files stay on your system.\n\nSelect standard modules on the left to scan hardware, index document repos, run sandboxed coding terminal tasks, or configure your local memories.`,
        timestamp: new Date().toLocaleTimeString(),
        core: "QEVRYN Core Orchestrator",
      }
    ]);
  }, []);

  // Sync Legal Doc content
  useEffect(() => {
    loadLegalDoc(selectedLegalDoc);
  }, [selectedLegalDoc]);

  // Handle hardware fetching
  const fetchHardware = async () => {
    try {
      const res = await fetch("/api/hardware");
      const data = await res.json();
      if (data.success) {
        setHardware(data.hardware);
      }
    } catch (e) {
      console.warn("Express server offline, falling back to simulated browser variables:", e);
      // Fallback mock hardware info matching navigator constraints
      setHardware({
        os: navigator.userAgent.includes("Windows") ? "Windows 11 Home/Pro (64-bit)" : "Linux Desktop (Ubuntu/Debian AMD64)",
        platform: navigator.userAgent.includes("Windows") ? "win32" : "linux",
        release: "22H2 / 24.04 LTS",
        cpu: "AMD Ryzen 7 7840HS with Radeon Graphics",
        cores: 16,
        totalRAM: "32 GB",
        freeRAM: "18 GB",
        gpu: "NVIDIA GeForce RTX 4060 Laptop GPU",
        accelerationBackends: ["CPU (AVX2, FMA)", "DirectML", "CUDA 12.4", "Vulkan (1.3)"],
        thermalState: "Nominal (41°C)",
        batteryState: {
          charging: true,
          level: "92%",
          saverMode: "Disabled"
        }
      });
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/security-logs");
      const data = await res.json();
      if (data.success) {
        setSecurityLogs(data.logs);
      }
    } catch (e) {
      setSecurityLogs([
        {
          timestamp: new Date().toISOString(),
          action: "OFFLINE_BACKEND_WARNING",
          severity: "warning",
          details: "Express server unreachable. Frontend running in browser sandbox.",
          source: "system"
        }
      ]);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (e) {
      console.log("Offline documents model");
    }
  };

  const fetchMemories = async () => {
    try {
      const res = await fetch("/api/memory");
      const data = await res.json();
      if (data.success) {
        setMemories(data.memory);
      }
    } catch (e) {
      console.log("Offline memory model");
    }
  };

  const loadLegalDoc = async (name: string) => {
    try {
      const res = await fetch(`/api/legal/${name}`);
      const data = await res.json();
      if (data.success) {
        setLegalContent(data.content);
      } else {
        setLegalContent(legalDocs[name] || "Document content not found.");
      }
    } catch (e) {
      setLegalContent(legalDocs[name] || "Document content not found.");
    }
  };

  // Chat message submit
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || loadingChat) return;

    const userPrompt = inputMessage;
    const currentUploadedImage = uploadedImage;
    setInputMessage("");
    setUploadedImage(null);
    setLoadingChat(true);

    const userMsg: ChatMessage = {
      id: "usr_" + Date.now(),
      role: "user",
      content: userPrompt,
      image: currentUploadedImage?.url,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userPrompt,
          mode,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          selectedModel: activeModel,
          image: currentUploadedImage ? { data: currentUploadedImage.data, mimeType: currentUploadedImage.mimeType } : null,
          aspectRatio,
          groundingType,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const assistantMsg: ChatMessage = {
          id: "asst_" + Date.now(),
          role: "assistant",
          content: data.response,
          core: data.core,
          reasoning: data.reasoning,
          grounding: data.grounding,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        
        // Track AWS credits spend estimation if hybrid or online triggers API
        if (mode !== "local") {
          setCloudSpendEst((prev) => Number((prev + 0.00015).toFixed(5)));
        }
      }
    } catch (error) {
      const assistantMsg: ChatMessage = {
        id: "asst_err_" + Date.now(),
        role: "assistant",
        content: `### 🛑 Core Outflow Interruption\nFailed to dispatch prompt to QEVRYN Core locally or over port gateway. Verify that the server is active on Port 3000.\n\n*Error details: Offline or refused connection.*`,
        timestamp: new Date().toLocaleTimeString(),
        core: "Emergency Routing Core",
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setLoadingChat(false);
      fetchLogs();
    }
  };

  // Document indexing upload
  const handleDocumentIndex = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim() || !uploadContent.trim()) return;

    setUploadingDoc(true);
    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: uploadName,
          content: uploadContent,
          type: "text/plain",
          size: uploadContent.length,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchDocuments();
        setUploadName("");
        setUploadContent("");
        fetchLogs();
      }
    } catch (e) {
      // Offline fallback listing
      const mockDoc: RAGDocument = {
        id: "mock_" + Date.now(),
        name: uploadName,
        size: uploadContent.length,
        type: "text/plain",
        uploadedAt: new Date().toISOString(),
        chunks: [uploadContent],
      };
      setDocuments((prev) => [...prev, mockDoc]);
      setUploadName("");
      setUploadContent("");
    } finally {
      setUploadingDoc(false);
    }
  };

  // Purge document chunk
  const deleteDoc = async (id: string) => {
    try {
      await fetch(`/api/documents/${id}`, { method: "DELETE" });
      fetchDocuments();
      fetchLogs();
    } catch (e) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    }
  };

  // Memory Addition
  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemKey.trim() || !newMemVal.trim()) return;

    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: newMemKey,
          value: newMemVal,
          type: newMemType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchMemories();
        setNewMemKey("");
        setNewMemVal("");
        fetchLogs();
      }
    } catch (e) {
      const mockMem: PersonalMemory = {
        id: "mem_" + Date.now(),
        key: newMemKey,
        value: newMemVal,
        timestamp: new Date().toISOString(),
        type: newMemType,
      };
      setMemories((prev) => [...prev, mockMem]);
      setNewMemKey("");
      setNewMemVal("");
    }
  };

  const deleteMemory = async (id: string) => {
    try {
      await fetch(`/api/memory/${id}`, { method: "DELETE" });
      fetchMemories();
      fetchLogs();
    } catch (e) {
      setMemories((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const wipeAllMemory = async () => {
    if (!window.confirm("Are you absolutely sure you want to wipe all local memories? This is irreversible.")) return;
    try {
      await fetch("/api/memory/wipe", { method: "POST" });
      fetchMemories();
      fetchLogs();
    } catch (e) {
      setMemories([]);
    }
  };

  // Sandbox Command Execution
  const handleExecuteCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxCommand.trim()) return;

    setSandboxSecurityWarning(null);

    // Prompt injection check (Client-side security guard)
    const unsafeRegex = /rm\s+-rf|mkfs|format|del\s+\/s|shutdown|reboot/gi;
    if (unsafeRegex.test(sandboxCommand)) {
      setSandboxSecurityWarning("SHIELD BLOCKED: Dangerous OS command detected. Preventing raw shell execution.");
      return;
    }

    try {
      const res = await fetch("/api/agent/run-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: sandboxCommand }),
      });
      const data = await res.json();
      if (data.success) {
        setSandboxOutput((prev) => prev + `\n\n$ ${sandboxCommand}\n${data.output}`);
      } else {
        setSandboxOutput((prev) => prev + `\n\n$ ${sandboxCommand}\n[Error]: ${data.error}`);
      }
      fetchLogs();
    } catch (e) {
      setSandboxOutput((prev) => prev + `\n\n$ ${sandboxCommand}\n[Local Mock Output]: Command executed successfully inside local thread.`);
    }
  };

  // Simulating the compilation of installable packages
  const handleSimulateInstallerBuild = () => {
    setInstallerStatus("building");
    setInstallerProgress(0);
    setBuildLogs([]);
    
    let currentProgress = 0;
    const logsMap: Record<number, string> = {
      10: targetPlatform === "macos" 
        ? "➜ Initializing Xcode command line tools for macOS (arm64)..." 
        : targetPlatform === "windows"
        ? "➜ Initializing MSVC compilation environment (cl.exe)..."
        : "➜ Setting up GCC build toolchain...",
      25: targetPlatform === "macos"
        ? "➜ Compiling source modules with clang -arch arm64 -O3..."
        : targetPlatform === "windows"
        ? "➜ Compiling source modules with cl.exe /O2 /MD..."
        : "➜ Compiling source files with gcc -O2 -fPIC...",
      40: targetPlatform === "macos"
        ? "➜ Linking Apple Metal (MPS) and Accelerate frameworks..."
        : targetPlatform === "windows"
        ? "➜ Linking DirectML, WinML, and DirectX 12 frameworks..."
        : "➜ Linking Vulkan runtime and open-source GPU libraries...",
      60: targetPlatform === "macos"
        ? `➜ Constructing QEVRYN.app bundle (${macArch === "m_series" ? "Apple Silicon" : macArch === "universal" ? "Universal Binary" : "Intel"}) and indexing local weights...`
        : targetPlatform === "windows"
        ? "➜ Bundling executable assets and embedding application manifest..."
        : "➜ Structuring AppDir framework and local resources...",
      75: targetPlatform === "macos"
        ? `➜ Code signing bundle using ${macSigning === "notarized" ? "Apple Developer ID & Notarization Ticket" : "Ad-Hoc Certificate"}...`
        : targetPlatform === "windows"
        ? "➜ Code signing executable package with security certificate..."
        : "➜ Assembling AppImage format structure...",
      90: targetPlatform === "macos"
        ? `➜ Packing high-compression QEVRYN_v0.1_M5_Air.${macFormat}...`
        : targetPlatform === "windows"
        ? "➜ Generating self-contained qevryn_v0.1_setup.exe installer..."
        : "➜ Running appimagetool compiler to compress AppImage binary...",
      100: targetPlatform === "macos"
        ? `✔ Apple Gatekeeper ${macSigning === "notarized" ? "Notarization" : "Signing"} successful. ${macFormat.toUpperCase()} package ready for offline execution!`
        : targetPlatform === "windows"
        ? "✔ Windows setup compiler finished. Package ready for installation!"
        : "✔ Linux AppImage compilation complete. Package ready for execution!"
    };

    const interval = setInterval(() => {
      currentProgress += 10;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setInstallerStatus("completed");
        setGeneratedChecksum(
          "sha256_" + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
        );
      }
      setInstallerProgress(currentProgress);
      
      const closestLogKey = Object.keys(logsMap)
        .map(Number)
        .filter(k => k <= currentProgress)
        .sort((a, b) => b - a)[0];
        
      if (closestLogKey && logsMap[closestLogKey]) {
        const logText = logsMap[closestLogKey];
        setBuildLogs(prev => {
          if (!prev.includes(logText)) {
            return [...prev, logText];
          }
          return prev;
        });
      }
    }, 400);
  };

  // Sound visualization simulation
  useEffect(() => {
    if (!canvasRef.current || (!isSpeaking && !isListening)) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = isListening ? "#ef4444" : "#e2ff00";
      ctx.beginPath();

      const sliceWidth = canvas.width / 50;
      for (let i = 0; i < 50; i++) {
        const x = i * sliceWidth;
        const amplitude = isListening ? 25 : 18;
        const y = canvas.height / 2 + Math.sin(angle + i * 0.15) * amplitude * Math.sin(angle * 0.8);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      angle += 0.1;
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isSpeaking, isListening]);

  // Real Audio Recording & Transcription via gemini-3.5-flash
  const handleToggleListening = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.warn("Media recorder stop error", e);
        }
      }
      setIsRecording(false);
      setIsListening(false);
    } else {
      setIsListening(true);
      setIsRecording(true);
      setSpeechOutput("Listening... Speak clearly into your mic.");
      audioChunksRef.current = [];

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          setSpeechOutput("Processing audio waves...");
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64String = reader.result as string;
            const base64Audio = base64String.split(",")[1];

            try {
              const res = await fetch("/api/transcribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ audioData: base64Audio, mimeType: "audio/webm" }),
              });
              const data = await res.json();
              if (data.success && data.text) {
                setInputMessage(data.text);
                setSpeechOutput(`Transcribed: "${data.text}"`);
              } else {
                setSpeechOutput("No speech detected. Please type manually.");
              }
            } catch (err) {
              setSpeechOutput("Transcription offline or server unreachable.");
            }
          };

          // Stop all media tracks to release microphone lock
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
      } catch (err) {
        console.warn("Microphone not available or allowed. Using offline voice simulation:", err);
        // Fallback simulated voice detection
        setTimeout(() => {
          setIsRecording(false);
          setIsListening(false);
          setInputMessage("Write a beautiful TypeScript code optimiser, bro!");
          setSpeechOutput("Transcribed (Simulated): 'Write a beautiful TypeScript code optimiser, bro!'");
        }, 2500);
      }
    }
  };

  const handleTriggerSpeechSynth = (text: string) => {
    setIsSpeaking(true);
    setTimeout(() => {
      setIsSpeaking(false);
    }, 3500);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(",")[1];
      setUploadedImage({
        data: base64Data,
        mimeType: file.type,
        url: base64String,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: "wel_1",
        role: "assistant",
        content: `### 👋 Welcome to QEVRYN v0.1 Desktop\n\nQEVRYN is an **offline-first intelligence layer and local operating system** for macOS, Windows, & Linux desktops.\n\n* **Branding**: Built by Veeomdecoders\n* **Current Mode**: \`Local (Fully Offline)\`\n* **Status**: 🟢 Safe and private. Your files stay on your system.\n\nSelect standard modules on the left to scan hardware, index document repos, run sandboxed coding terminal tasks, or configure your local memories.`,
        timestamp: new Date().toLocaleTimeString(),
        core: "QEVRYN Core Orchestrator",
      }
    ]);
    setInputMessage("");
    setUploadedImage(null);
  };

  // Budget calculations
  const budgetPercentage = Math.min(100, Math.max(0, (cloudSpendEst / cloudBudgetLimit) * 100));

  return (
    <div className="min-h-screen bg-[#070708] text-[#f0f0f0] font-sans flex flex-col antialiased">
      {/* Main Workspace Frame */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Control Sidebar */}
        {sidebarOpen && (
          <div className="w-80 bg-[#0c0c0e] border-r border-zinc-800/80 flex flex-col p-4.5 space-y-5 shrink-0 overflow-y-auto">
            
            {/* Header / Branding */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="h-7 w-7 bg-[#e2ff00] rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(226,255,0,0.35)]">
                  <span className="font-display font-bold text-base text-black">Q</span>
                </div>
                <div>
                  <h1 className="text-sm font-bold tracking-tight text-white font-display">QEVRYN</h1>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Veeomdecoders</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-850 text-zinc-500 hover:text-white transition-colors border border-transparent hover:border-zinc-800 cursor-pointer"
                title="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="w-full py-2.5 px-3.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold flex items-center justify-center space-x-2 transition-all text-zinc-200 cursor-pointer"
            >
              <Plus className="h-4 w-4 text-[#e2ff00]" />
              <span>New Chat</span>
            </button>

            {/* Navigation Modules */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 px-2 block mb-2">Modules</span>
              
              <button
                onClick={() => setActiveTab("workspace")}
                className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-3 cursor-pointer ${activeTab === "workspace" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"}`}
              >
                <Plus className="h-4 w-4 text-[#e2ff00] rotate-45" />
                <span>Chat Workspace</span>
              </button>
              
              <button
                onClick={() => setActiveTab("sandbox")}
                className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-3 cursor-pointer ${activeTab === "sandbox" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"}`}
              >
                <Terminal className="h-4 w-4 text-sky-400" />
                <span>Coding Sandbox</span>
              </button>
              
              <button
                onClick={() => setActiveTab("rag")}
                className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-3 cursor-pointer ${activeTab === "rag" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"}`}
              >
                <Database className="h-4 w-4 text-emerald-400" />
                <span>Local RAG Store</span>
              </button>
              
              <button
                onClick={() => setActiveTab("memory")}
                className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-3 cursor-pointer ${activeTab === "memory" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"}`}
              >
                <BookOpen className="h-4 w-4 text-amber-400" />
                <span>Personal Memory</span>
              </button>
              
              <button
                onClick={() => setActiveTab("logs")}
                className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-3 cursor-pointer ${activeTab === "logs" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"}`}
              >
                <Shield className="h-4 w-4 text-indigo-400" />
                <span>Security Audit Logs</span>
              </button>
              
              <button
                onClick={() => setActiveTab("legal")}
                className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-3 cursor-pointer ${activeTab === "legal" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"}`}
              >
                <FileText className="h-4 w-4 text-rose-400" />
                <span>Trust Center (Legal)</span>
              </button>
            </div>

            {/* Diagnostic Telemetry simple line */}
            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs px-1">
              <span className="text-zinc-500 font-semibold text-[11px]">Private Local Logs</span>
              <input
                type="checkbox"
                checked={telemetry}
                onChange={(e) => setTelemetry(e.target.checked)}
                className="h-3.5 w-3.5 rounded bg-zinc-900 border-zinc-800 text-[#e2ff00] focus:ring-0 cursor-pointer accent-[#e2ff00]"
              />
            </div>

            {/* Package Builder Widget Section */}
            <div className="border-t border-zinc-800/60 pt-3 flex-1 flex flex-col justify-end">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 px-1 block mb-3">Package Builder</span>
              
              <div className="grid grid-cols-3 gap-1 px-1 mb-3">
                <button
                  onClick={() => { setTargetPlatform("macos"); setInstallerStatus("idle"); }}
                  className={`py-1 px-1.5 rounded text-[10px] font-bold text-center transition-all cursor-pointer ${targetPlatform === "macos" ? "bg-[#e2ff00] text-black" : "bg-zinc-900 text-zinc-400 border border-zinc-850 hover:text-zinc-200"}`}
                >
                  macOS
                </button>
                <button
                  onClick={() => { setTargetPlatform("windows"); setInstallerStatus("idle"); }}
                  className={`py-1 px-1.5 rounded text-[10px] font-bold text-center transition-all cursor-pointer ${targetPlatform === "windows" ? "bg-[#e2ff00] text-black" : "bg-zinc-900 text-zinc-400 border border-zinc-850 hover:text-zinc-200"}`}
                >
                  Windows
                </button>
                <button
                  onClick={() => { setTargetPlatform("linux"); setInstallerStatus("idle"); }}
                  className={`py-1 px-1.5 rounded text-[10px] font-bold text-center transition-all cursor-pointer ${targetPlatform === "linux" ? "bg-[#e2ff00] text-black" : "bg-zinc-900 text-zinc-400 border border-zinc-850 hover:text-zinc-200"}`}
                >
                  Linux
                </button>
              </div>

              {targetPlatform === "macos" ? (
                /* DISTINCT TRANSLUCENT MACOS APP WINDOW BUILDER DESIGN */
                <div className="rounded-xl bg-zinc-950/75 border border-zinc-800 p-3 shadow-2xl relative overflow-hidden backdrop-blur-md">
                  {/* Traffic light window controls */}
                  <div className="flex items-center space-x-1.5 mb-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] shadow-[0_0_6px_rgba(255,95,86,0.3)]"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] shadow-[0_0_6px_rgba(255,189,46,0.3)]"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] shadow-[0_0_6px_rgba(39,201,63,0.3)]"></span>
                    <span className="text-[8.5px] font-mono text-zinc-400 ml-1.5 font-bold tracking-tight">M5 Air Builder (.dmg)</span>
                  </div>

                  <div className="space-y-2.5 mt-2">
                    <div>
                      <label className="text-[9px] text-zinc-400 block mb-1 font-bold">Hardware Target</label>
                      <select
                        value={macArch}
                        onChange={(e) => setMacArch(e.target.value as any)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[9.5px] text-zinc-200 outline-none cursor-pointer hover:border-zinc-750"
                      >
                        <option value="m_series">Apple Silicon M5 (Optimized ARM64)</option>
                        <option value="universal">Universal Binary (ARM64 + Intel)</option>
                        <option value="intel">Legacy Intel (x86_64)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] text-zinc-400 block mb-1 font-bold">Distribution Bundle</label>
                      <select
                        value={macFormat}
                        onChange={(e) => setMacFormat(e.target.value as any)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[9.5px] text-zinc-200 outline-none cursor-pointer hover:border-zinc-750"
                      >
                        <option value="dmg">Disk Image (.dmg)</option>
                        <option value="app">App Bundle (.app)</option>
                        <option value="pkg">Installer Package (.pkg)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-zinc-400 border-t border-zinc-800/50 pt-2 pb-0.5">
                      <span>Neural Engine Cores:</span>
                      <span className="text-[#e2ff00] font-mono font-bold uppercase">MPS Accelerated</span>
                    </div>

                    {installerStatus === "idle" && (
                      <button
                        onClick={handleSimulateInstallerBuild}
                        className="w-full bg-white text-black hover:bg-zinc-200 text-[10px] font-extrabold py-2 rounded-lg transition-all mt-2.5 flex items-center justify-center space-x-1.5 cursor-pointer shadow-md"
                      >
                        <Download className="h-3 w-3 text-black" />
                        <span>Build dmg for M5 Air</span>
                      </button>
                    )}
                  </div>

                  {installerStatus === "building" && (
                    <div className="space-y-2 mt-3">
                      <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden">
                        <div className="bg-[#e2ff00] h-full transition-all duration-300" style={{ width: `${installerProgress}%` }}></div>
                      </div>
                      <span className="text-[9px] text-zinc-300 font-mono block text-center font-semibold">Compiling workspace... {installerProgress}%</span>
                    </div>
                  )}

                  {installerStatus === "completed" && (
                    <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-2 text-[9.5px] font-mono">
                      <div className="text-emerald-400 flex items-center space-x-1">
                        <Check className="h-3.5 w-3.5" />
                        <span className="font-extrabold uppercase tracking-wide">Build Succeeded</span>
                      </div>
                      <span className="text-zinc-200 block truncate font-semibold">qevryn_v0.1_M5_Air.{macFormat}</span>
                      <span className="text-[8px] text-zinc-500 block truncate">SHA256: {generatedChecksum.substring(0, 18)}...</span>
                      <button
                        onClick={() => setInstallerStatus("idle")}
                        className="text-[#e2ff00] hover:underline block text-[9.5px] font-bold"
                      >
                        Build another package
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* STANDARD WINDOWS / LINUX STYLING */
                <div className="rounded-lg bg-zinc-900/60 border border-zinc-800 p-3 space-y-3">
                  <span className="text-[9px] font-mono text-zinc-500 block">Target: {targetPlatform === "windows" ? "Windows Setup" : "Linux AppImage"}</span>
                  
                  {installerStatus === "idle" && (
                    <button
                      onClick={handleSimulateInstallerBuild}
                      className="w-full bg-zinc-800 hover:bg-zinc-750 text-white text-[10px] py-1.5 rounded border border-zinc-750 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer font-bold"
                    >
                      <Download className="h-3.5 w-3.5 text-[#e2ff00]" />
                      <span>Compile Package</span>
                    </button>
                  )}

                  {installerStatus === "building" && (
                    <div className="space-y-1.5">
                      <div className="w-full bg-zinc-950 rounded h-1 overflow-hidden">
                        <div className="bg-[#e2ff00] h-full transition-all duration-300" style={{ width: `${installerProgress}%` }}></div>
                      </div>
                      <span className="text-[9px] text-zinc-400 font-mono block text-center font-semibold">Assembling binaries... {installerProgress}%</span>
                    </div>
                  )}

                  {installerStatus === "completed" && (
                    <div className="space-y-1.5 text-[9px] font-mono">
                      <div className="flex items-center text-[#e2ff00] space-x-1">
                        <Check className="h-3 w-3" />
                        <span className="font-bold">Succeeded</span>
                      </div>
                      <span className="text-zinc-400 block truncate font-semibold">qevryn_v0.1_installer.{targetPlatform === "windows" ? "exe" : "AppImage"}</span>
                      <span className="text-[8px] text-zinc-500 block truncate font-semibold font-mono">SHA-256: {generatedChecksum.substring(0, 18)}...</span>
                      <button
                        onClick={() => setInstallerStatus("idle")}
                        className="text-[#e2ff00] hover:underline block font-bold"
                      >
                        Rebuild package
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Console build output logs when compiling */}
              {installerStatus === "building" && buildLogs.length > 0 && (
                <div className="mt-2.5 p-2 bg-black border border-zinc-900 rounded font-mono text-[8px] text-zinc-400 max-h-[105px] overflow-y-auto space-y-1">
                  {buildLogs.map((log, idx) => (
                    <div key={idx} className="truncate">{log}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Central Workspace Tabbed Area */}
        <div className="flex-1 flex flex-col bg-[#070708]">
          {/* Workspace Top Bar (Sleek, ChatGPT / Claude style) */}
          <div className="border-b border-zinc-800 bg-[#0c0c0e] px-6 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-1.5 rounded-lg hover:bg-zinc-850 text-zinc-400 hover:text-white transition-colors border border-zinc-800 shrink-0 cursor-pointer"
                  title="Expand sidebar"
                >
                  <Menu className="h-4 w-4" />
                </button>
              )}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-zinc-200 capitalize font-display">
                  {activeTab === "workspace" ? "Chat Workspace" : activeTab === "sandbox" ? "Coding Sandbox" : activeTab === "rag" ? "Local RAG Store" : activeTab === "memory" ? "Personal Memory" : activeTab === "logs" ? "Security Logs" : "Trust Center"}
                </span>
                <span className="text-[9px] bg-zinc-800/80 px-2 py-0.5 rounded-full font-mono font-semibold text-zinc-400 border border-zinc-700/40">
                  {mode === "local" ? "🟢 Local First" : mode === "hybrid" ? "🌗 Hybrid" : "🌐 Online"}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-[10px] font-bold text-zinc-500 font-mono hidden sm:inline uppercase tracking-wider">Built by Veeomdecoders</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="bg-zinc-900 text-xs font-semibold text-zinc-300 border border-zinc-800 px-3 py-1.5 rounded-lg outline-none cursor-pointer hover:border-zinc-750"
              >
                <option value="local">🟢 Local First</option>
                <option value="hybrid">🌗 Hybrid Mode</option>
                <option value="online">🌐 Online Mode</option>
              </select>
            </div>
          </div>

          {/* Active Tab Viewport */}
          <div className="flex-1 overflow-hidden flex flex-col">
            
            {/* ---------------------------------------------------- */}
            {/* TAB 1: Chat Workspace */}
            {/* ---------------------------------------------------- */}
            {activeTab === "workspace" && (
              <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
                
                {/* Message display viewport */}
                <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6">
                  <div className="max-w-4xl mx-auto w-full space-y-6">
                    {messages.map((m) => {
                      const isUser = m.role === "user";
                      return (
                        <div
                          key={m.id}
                          className={`flex items-start space-x-4 ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          {/* Left Avatar for Assistant */}
                          {!isUser && (
                            <div className="h-8 w-8 rounded-lg bg-[#e2ff00] text-black font-bold flex items-center justify-center shrink-0 shadow-[0_0_8px_#e2ff00] text-sm">
                              Q
                            </div>
                          )}

                          <div className={`flex flex-col space-y-1.5 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
                            {/* Message Header (Sender Info) */}
                            <div className="flex items-center space-x-2 text-[10px] text-zinc-500 font-mono">
                              <span className="font-bold text-zinc-400">{isUser ? "You" : "QEVRYN AI"}</span>
                              <span>•</span>
                              <span>{m.timestamp}</span>
                              {m.core && (
                                <>
                                  <span>•</span>
                                  <span className="text-[#e2ff00] font-bold bg-[#e2ff00]/10 px-1.5 py-0.5 rounded border border-[#e2ff00]/10">
                                    {m.core}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Message Bubble */}
                            <div
                              className={`p-4 rounded-xl text-sm leading-relaxed border ${
                                isUser
                                  ? "bg-[#181818] border-[#2a2a2a] text-[#f0f0f0] rounded-tr-none shadow-sm"
                                  : "bg-[#0f0f0f] border-[#222] text-[#e2e2e2] rounded-tl-none"
                              }`}
                            >
                              {/* Attached Image inside the bubble */}
                              {m.image && (
                                <div className="mb-3 max-w-sm rounded overflow-hidden border border-[#222] shadow">
                                  <img src={m.image} alt="Uploaded attachment" className="w-full h-auto object-cover max-h-60" referrerPolicy="no-referrer" />
                                </div>
                              )}

                              {/* Message Markdown Parsing */}
                              <div className="space-y-2 whitespace-pre-wrap">
                                {m.content.split("\n").map((line, idx) => {
                                  if (line.startsWith("### ")) {
                                    return <h3 key={idx} className="text-base font-bold text-[#e2ff00] mt-3">{line.replace("### ", "")}</h3>;
                                  }
                                  if (line.startsWith("## ")) {
                                    return <h2 key={idx} className="text-lg font-bold text-white mt-4">{line.replace("## ", "")}</h2>;
                                  }
                                  if (line.startsWith("* ")) {
                                    return <li key={idx} className="ml-4 list-disc text-zinc-300">{line.replace("* ", "")}</li>;
                                  }
                                  if (line.startsWith("1. ")) {
                                    return <li key={idx} className="ml-4 list-decimal text-zinc-300">{line.replace("1. ", "")}</li>;
                                  }
                                  if (line.startsWith("`") && line.endsWith("`")) {
                                    return <code key={idx} className="block font-mono text-xs p-2 rounded my-1 bg-black/50 text-[#e2ff00] border border-zinc-800">{line.replace(/`/g, "")}</code>;
                                  }
                                  return <p key={idx} className="text-zinc-300">{line}</p>;
                                })}
                              </div>

                              {/* Grounding elements if available */}
                              {m.grounding && m.grounding.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-zinc-800">
                                  <span className="text-xs font-semibold text-zinc-400 block mb-2 flex items-center space-x-1">
                                    <Globe className="h-3.5 w-3.5 text-[#e2ff00]" />
                                    <span>Grounded Sources:</span>
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {m.grounding.map((g, gIdx) => (
                                      <a
                                        key={gIdx}
                                        href={g.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-mono bg-zinc-900 text-[#e2ff00] px-2.5 py-1 rounded border border-[#222] hover:border-[#e2ff00] flex items-center space-x-1 transition-colors"
                                      >
                                        <span>{g.title}</span>
                                        <ChevronRight className="h-3 w-3" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* TTS Speak Action Button */}
                            {!isUser && (
                              <button
                                onClick={() => handleTriggerSpeechSynth(m.content)}
                                className="mt-1 text-[10px] text-zinc-500 hover:text-[#e2ff00] flex items-center space-x-1 font-mono transition-colors"
                              >
                                <Volume2 className="h-3 w-3" />
                                <span>Speak ({activeVoice})</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Quick suggestion prompt starter cards (Shown on start / empty state) */}
                    {messages.length <= 1 && (
                      <div className="pt-8 space-y-6">
                        <div className="text-center space-y-2">
                          <h2 className="text-3xl font-bold tracking-tight font-display text-white">QEVRYN Workspace</h2>
                          <p className="text-sm text-zinc-400 max-w-md mx-auto">
                            The secure desktop intelligence operating system. Built by <span className="text-[#e2ff00] font-semibold">Veeomdecoders</span>.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto pt-4">
                          <button
                            onClick={() => setInputMessage("Analyze current legal frameworks and draft a privacy compliance agreement.")}
                            className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-[#e2ff00]/40 text-left transition-all hover:bg-zinc-900/50 group"
                          >
                            <h4 className="text-xs font-bold text-white group-hover:text-[#e2ff00] mb-1 font-mono">⚖️ Legal & Compliance</h4>
                            <p className="text-xs text-zinc-400">Draft a localized offline trust agreement draft.</p>
                          </button>
                          <button
                            onClick={() => setInputMessage("Write a highly optimized TypeScript routine for cloud spend monitoring.")}
                            className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-[#e2ff00]/40 text-left transition-all hover:bg-zinc-900/50 group"
                          >
                            <h4 className="text-xs font-bold text-white group-hover:text-[#e2ff00] mb-1 font-mono">💻 Code Optimizer</h4>
                            <p className="text-xs text-zinc-400">Design TypeScript functions inside the Sandbox.</p>
                          </button>
                          <button
                            onClick={() => setInputMessage("Yo bro! Let's build a secure firewall system, how do we start? Give me a motivational talk!")}
                            className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-[#e2ff00]/40 text-left transition-all hover:bg-zinc-900/50 group"
                          >
                            <h4 className="text-xs font-bold text-white group-hover:text-[#e2ff00] mb-1 font-mono">👊 Speak with Bro Core</h4>
                            <p className="text-xs text-zinc-400">Bounce coding blueprints off your high-energy AI buddy.</p>
                          </button>
                          <button
                            onClick={() => {
                              setActiveModel("gemini-3.1-flash-image");
                              setInputMessage("Generate a 16:9 modern abstract workspace blueprint diagram.");
                            }}
                            className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-[#e2ff00]/40 text-left transition-all hover:bg-zinc-900/50 group"
                          >
                            <h4 className="text-xs font-bold text-white group-hover:text-[#e2ff00] mb-1 font-mono">🎨 Blueprints & Diagrams</h4>
                            <p className="text-xs text-zinc-400">Render exact aspect ratio mockups using the Image Core.</p>
                          </button>
                        </div>
                      </div>
                    )}

                    {loadingChat && (
                      <div className="flex items-start space-x-4">
                        <div className="h-8 w-8 rounded-lg bg-zinc-800 text-zinc-500 font-bold flex items-center justify-center shrink-0 animate-pulse text-sm">
                          Q
                        </div>
                        <div className="flex flex-col space-y-1.5 max-w-[80%]">
                          <div className="text-[10px] text-zinc-500 font-mono">Routing query...</div>
                          <div className="bg-[#0f0f0f] border border-zinc-800 p-4 rounded-xl flex items-center space-x-3 text-zinc-300">
                            <RefreshCw className="h-4 w-4 text-[#e2ff00] animate-spin" />
                            <span className="text-xs font-mono">Consulting active routing cores...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Microphone / Sound Visualization Panel */}
                {(isSpeaking || isListening) && (
                  <div className="bg-[#0d0d0d] border-t border-zinc-800 py-3 px-6 flex items-center justify-between">
                    <span className="text-xs font-mono text-[#e2ff00] animate-pulse flex items-center space-x-2">
                      <Volume2 className="h-4 w-4 animate-bounce" />
                      <span>{speechOutput}</span>
                    </span>
                    <canvas ref={canvasRef} width="220" height="35" className="h-9 w-44 opacity-80" />
                  </div>
                )}

                {/* Chat Workspace Input Footer (ChatGPT / Claude visual layout) */}
                <div className="p-4 border-t border-zinc-800 bg-[#0d0d0d]/80 backdrop-blur">
                  <div className="max-w-4xl mx-auto w-full">
                    
                    {/* Hidden Image Input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    {/* Image Upload Thumbnail Preview */}
                    {uploadedImage && (
                      <div className="mb-3 p-2 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between max-w-xs">
                        <div className="flex items-center space-x-2">
                          <div className="h-10 w-10 rounded overflow-hidden border border-zinc-700">
                            <img src={uploadedImage.url} alt="Thumbnail preview" className="w-full h-full object-cover" />
                          </div>
                          <div className="text-xs">
                            <span className="text-white block font-medium truncate max-w-[150px]">Image attached</span>
                            <span className="text-[10px] text-zinc-500 uppercase">{uploadedImage.mimeType.split("/")[1]}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUploadedImage(null)}
                          className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    <form onSubmit={handleSendMessage} className="bg-[#121212] border border-zinc-800 rounded-xl overflow-hidden focus-within:border-[#e2ff00] transition-colors shadow-lg">
                      {/* Input text field */}
                      <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder={isListening ? "Listening actively..." : "Message QEVRYN Core locally..."}
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="w-full bg-transparent px-4 pt-3.5 pb-2 text-sm text-white placeholder-zinc-500 focus:outline-none resize-none min-h-[44px]"
                      />

                      {/* Toolbars and configuration controls */}
                      <div className="flex flex-wrap items-center justify-between px-3 py-2 border-t border-zinc-900/60 bg-[#0f0f0f] gap-2">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-zinc-400">
                          {/* Attach Image button */}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 rounded-lg hover:bg-zinc-800 hover:text-[#e2ff00] transition-colors"
                            title="Attach Image"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </button>

                          {/* Grounding Mode toggle */}
                          <button
                            type="button"
                            onClick={() => {
                              if (groundingType === "none") setGroundingType("search");
                              else if (groundingType === "search") setGroundingType("maps");
                              else setGroundingType("none");
                            }}
                            className={`p-1 px-2.5 rounded-lg border flex items-center space-x-1.5 transition-all ${
                              groundingType === "none"
                                ? "border-zinc-800 hover:border-zinc-700 text-zinc-400"
                                : groundingType === "search"
                                ? "border-sky-500/30 bg-sky-500/10 text-sky-400"
                                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            }`}
                            title="Toggle Grounding (Google Search / Maps)"
                          >
                            {groundingType === "none" && <Globe className="h-3.5 w-3.5" />}
                            {groundingType === "search" && <Globe className="h-3.5 w-3.5 text-sky-400" />}
                            {groundingType === "maps" && <MapPin className="h-3.5 w-3.5 text-emerald-400" />}
                            <span className="text-[10px] uppercase font-bold">
                              {groundingType === "none" ? "No Grounding" : groundingType === "search" ? "Google Search" : "Google Maps"}
                            </span>
                          </button>

                          {/* Aspect Ratio Selector */}
                          <select
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] text-zinc-300 outline-none cursor-pointer hover:border-zinc-700 font-bold"
                            title="Image Aspect Ratio"
                          >
                            <option value="1:1">1:1 Ratio</option>
                            <option value="16:9">16:9 Ratio</option>
                            <option value="9:16">9:16 Ratio</option>
                            <option value="3:2">3:2 Ratio</option>
                            <option value="2:3">2:3 Ratio</option>
                          </select>

                          {/* Inference Model selector dropdown */}
                          <select
                            value={activeModel}
                            onChange={(e) => setActiveModel(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] text-zinc-300 outline-none cursor-pointer hover:border-zinc-700 font-bold"
                            title="Active Model Core"
                          >
                            <option value="Llama-3-8B-Instruct (Local)">Meta Llama 3 8B (Local)</option>
                            <option value="Gemma-2-9B (Local)">Google Gemma 2 9B (Local)</option>
                            <option value="gemini-3.5-flash">Google Gemini 3.5 (Cloud)</option>
                            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Fast)</option>
                            <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Thinking Mode)</option>
                            <option value="image-gen">QEVRYN Image Core (Image Gen)</option>
                            <option value="bro-core">QEVRYN Bro Core (Companion)</option>
                          </select>
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Microphone recorder trigger */}
                          <button
                            type="button"
                            onClick={handleToggleListening}
                            className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
                              isRecording
                                ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse"
                                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                            }`}
                            title={isRecording ? "Stop Recording" : "Record Audio / Microphone"}
                          >
                            <Mic className="h-4 w-4" />
                          </button>

                          {/* Send submit button */}
                          <button
                            type="submit"
                            disabled={loadingChat || !inputMessage.trim()}
                            className="p-2 rounded-lg bg-[#e2ff00] disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold transition-all hover:bg-[#cbe600]"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </form>
                    
                    <p className="text-[9px] text-zinc-600 text-center mt-2.5 font-mono">
                      QEVRYN Core • Built by <span className="font-bold text-zinc-500">Veeomdecoders</span> • Fully private offline-first system
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 2: Sandbox / Coding Agent Terminal */}
            {/* ---------------------------------------------------- */}
            {activeTab === "sandbox" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-5 border-b border-[#222] bg-[#0c0c0c]/90 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold font-display text-[#f0f0f0] flex items-center space-x-1.5">
                      <Code className="h-4 w-4 text-[#e2ff00]" />
                      <span>Coding Workspace Agent</span>
                    </h3>
                    <p className="text-xs text-slate-500">Run safe, sandboxed shell instructions on local code trees.</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Repository Map Status: 🟢 Fully Indexed</span>
                </div>

                <div className="flex-1 flex overflow-hidden">
                  {/* File Workspace status */}
                  <div className="w-64 border-r border-[#222] bg-[#050505] p-4 space-y-4 overflow-y-auto shrink-0">
                    <span className="text-xs font-semibold text-slate-400 block mb-2 uppercase">Workspace Files</span>
                    <div className="space-y-2">
                      {sandboxFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-[#0c0c0c] border border-[#222]">
                          <span className="text-slate-300 font-mono truncate mr-2">{file.path}</span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${file.status === "Modified" ? "bg-amber-500/10 text-amber-400" : "bg-[#181818] text-slate-400"}`}>
                            {file.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-[#222] pt-4 space-y-2">
                      <span className="text-xs font-semibold text-slate-400 block">Visual Diff Preview</span>
                      <p className="text-[11px] text-slate-500">View file modification patches before compiling.</p>
                      <button
                        onClick={() => setVisualDiffOpen(!visualDiffOpen)}
                        className="w-full text-xs font-mono bg-[#0c0c0c] hover:bg-[#181818] text-[#e2ff00] border border-[#222] py-1.5 px-3 rounded text-center transition-colors cursor-pointer"
                      >
                        {visualDiffOpen ? "Hide Patch Diff" : "Show Git Diff"}
                      </button>
                    </div>
                  </div>

                  {/* Terminal Execution */}
                  <div className="flex-1 flex flex-col bg-[#050505] p-5 overflow-hidden">
                    {/* Visual diff section if expanded */}
                    {visualDiffOpen && (
                      <div className="mb-4 flex-1 bg-[#0c0c0c] border border-[#222] rounded p-4 font-mono text-xs overflow-y-auto space-y-2">
                        <span className="text-xs font-semibold text-amber-400 block mb-1">=== GIT WORKSPACE DIFF PREVIEW ===</span>
                        <div className="text-red-400">{"- export default function App() {}"}</div>
                        <div className="text-emerald-400">{"+ // Built by Veeomdecoders - local offline optimizer"}</div>
                        <div className="text-emerald-400">{"+ export default function App() { return <div>QEVRYN</div>; }"}</div>
                        <span className="text-slate-500 italic mt-2 block">All writes require manual diff approvals to mitigate payload injection vulnerabilities.</span>
                      </div>
                    )}

                    <div className="flex-1 bg-[#0c0c0c] border border-[#222] rounded p-4 font-mono text-xs overflow-y-auto text-slate-300">
                      <span className="text-slate-500 block">QEVRYN Secure Command Sandbox v0.1 initialized...</span>
                      <span className="text-slate-500 block">Shell environment: BASH / POWERSHELL</span>
                      <pre className="mt-3 whitespace-pre-wrap">{sandboxOutput || "Terminal output clean. Run a command above."}</pre>
                    </div>

                    {sandboxSecurityWarning && (
                      <div className="mt-3 bg-red-950/40 border border-red-500/50 p-3 rounded flex items-start space-x-2 text-xs text-red-400 font-mono">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{sandboxSecurityWarning}</span>
                      </div>
                    )}

                    <form onSubmit={handleExecuteCommand} className="mt-4 flex space-x-3">
                      <div className="flex-1 flex bg-[#0c0c0c] border border-[#222] rounded px-3 items-center">
                        <span className="text-slate-500 font-mono text-xs mr-2">$</span>
                        <input
                          type="text"
                          value={sandboxCommand}
                          onChange={(e) => setSandboxCommand(e.target.value)}
                          placeholder="git status / npm test / node app.js"
                          className="flex-1 bg-transparent py-2.5 text-xs font-mono text-slate-100 placeholder-slate-600 outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-[#e2ff00] hover:bg-[#cbe600] text-black font-bold font-mono text-xs px-4 rounded transition-all cursor-pointer"
                      >
                        Execute
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 3: Document Upload / Local RAG Store */}
            {/* ---------------------------------------------------- */}
            {activeTab === "rag" && (
              <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold font-display text-[#f0f0f0] flex items-center space-x-2">
                    <Database className="h-5 w-5 text-[#e2ff00]" />
                    <span>Local Document ingestion (RAG)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Parse and chunk private files (.pdf, .txt, .docx). Documents stay locally on your computer.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
                  
                  {/* Document ingestion form */}
                  <div className="bg-[#0c0c0c] p-5 rounded-lg border border-[#222] flex flex-col overflow-y-auto">
                    <span className="text-xs font-semibold text-slate-400 block mb-3 uppercase">Parser Settings</span>
                    <form onSubmit={handleDocumentIndex} className="space-y-4 flex-1 flex flex-col">
                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1.5">Document Title/Name</label>
                        <input
                          type="text"
                          value={uploadName}
                          onChange={(e) => setUploadName(e.target.value)}
                          placeholder="programming_docs.txt"
                          required
                          className="w-full bg-[#050505] border border-[#222] px-3 py-2 rounded text-xs text-slate-300 outline-none focus:border-[#e2ff00]"
                        />
                      </div>

                      <div className="flex-1 flex flex-col">
                        <label className="block text-xs font-mono text-slate-300 mb-1.5">Document Content</label>
                        <textarea
                          value={uploadContent}
                          onChange={(e) => setUploadContent(e.target.value)}
                          placeholder="Paste or drop file contents here. The system will slice it into logical overlapping paragraphs to construct embeddings vector maps."
                          required
                          className="w-full flex-1 bg-[#050505] border border-[#222] px-3 py-2 rounded text-xs text-slate-300 font-mono outline-none focus:border-[#e2ff00] resize-none min-h-[160px]"
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        disabled={uploadingDoc}
                        className="w-full bg-[#e2ff00] hover:bg-[#cbe600] disabled:bg-[#181818] text-black font-bold text-xs py-2.5 rounded shadow transition-colors font-display cursor-pointer"
                      >
                        {uploadingDoc ? "Analyzing and chunking..." : "Parse and Ingest Document"}
                      </button>
                    </form>
                  </div>

                  {/* Document index list */}
                  <div className="bg-[#0c0c0c] p-5 rounded-lg border border-[#222] flex flex-col overflow-y-auto">
                    <span className="text-xs font-semibold text-slate-400 block mb-3 uppercase">Active Indexed Documents</span>
                    {documents.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-2">
                        <Database className="h-8 w-8 opacity-40" />
                        <span className="text-xs">No documents indexed in local space yet.</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {documents.map((doc) => (
                          <div key={doc.id} className="p-3 bg-[#050505] rounded border border-[#222] space-y-2 flex flex-col">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4.5 w-4.5 text-[#e2ff00]" />
                                <span className="text-xs font-semibold text-slate-200 truncate">{doc.name}</span>
                              </div>
                              <button
                                onClick={() => deleteDoc(doc.id)}
                                className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                              <span>Size: {doc.size} bytes</span>
                              <span>Chunks: {doc.chunksCount || doc.chunks.length}</span>
                              <span>Indexed locally</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 4: Personal Memory Viewer */}
            {/* ---------------------------------------------------- */}
            {activeTab === "memory" && (
              <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold font-display text-[#f0f0f0] flex items-center space-x-2">
                      <BookOpen className="h-5 w-5 text-[#e2ff00]" />
                      <span>Persistent Local Memory Layer</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Personalize models locally without sending private facts to external servers. All memories are stored on disk.
                    </p>
                  </div>
                  {memories.length > 0 && (
                    <button
                      onClick={wipeAllMemory}
                      className="bg-red-950/80 text-red-400 hover:bg-red-900/90 border border-red-500/30 text-xs font-mono py-1.5 px-3 rounded flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Wipe All Memory</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
                  {/* Create memory factor */}
                  <div className="bg-[#0c0c0c] p-5 rounded-lg border border-[#222] flex flex-col">
                    <span className="text-xs font-semibold text-slate-400 block mb-3 uppercase">Persist Fact/Preference</span>
                    <form onSubmit={handleAddMemory} className="space-y-4">
                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1.5">Context Key</label>
                        <input
                          type="text"
                          value={newMemKey}
                          onChange={(e) => setNewMemKey(e.target.value)}
                          placeholder="user_preferred_coding_language"
                          required
                          className="w-full bg-[#050505] border border-[#222] px-3 py-2 rounded text-xs text-slate-300 outline-none focus:border-[#e2ff00]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1.5">Context Value</label>
                        <input
                          type="text"
                          value={newMemVal}
                          onChange={(e) => setNewMemVal(e.target.value)}
                          placeholder="TypeScript"
                          required
                          className="w-full bg-[#050505] border border-[#222] px-3 py-2 rounded text-xs text-slate-300 outline-none focus:border-[#e2ff00]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1.5">Classification Type</label>
                        <select
                          value={newMemType}
                          onChange={(e) => setNewMemType(e.target.value as any)}
                          className="w-full bg-[#050505] border border-[#222] px-3 py-2 rounded text-xs font-mono text-[#f0f0f0] outline-none focus:border-[#e2ff00]"
                        >
                          <option value="fact">Fact (Knowledge point)</option>
                          <option value="preference">Preference (UI / settings)</option>
                          <option value="context">Context (Ongoing conversation background)</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#e2ff00] hover:bg-[#cbe600] text-black font-bold text-xs py-2 rounded shadow transition-colors font-display flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Plus className="h-4.5 w-4.5" />
                        <span>Persist Memory</span>
                      </button>
                    </form>
                  </div>

                  {/* List memory facts */}
                  <div className="bg-[#0c0c0c] p-5 rounded-lg border border-[#222] flex flex-col overflow-y-auto">
                    <span className="text-xs font-semibold text-slate-400 block mb-3 uppercase">Memory Sovereignty Log</span>
                    {memories.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-2">
                        <BookOpen className="h-8 w-8 opacity-40" />
                        <span className="text-xs">Your memory core is completely blank. Add context above.</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {memories.map((m) => (
                          <div key={m.id} className="p-3 bg-[#050505] rounded border border-[#222] flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xs font-bold text-[#e2ff00] font-mono">{m.key}</span>
                                <span className="text-[9px] uppercase font-mono text-slate-400 bg-[#0c0c0c] px-1.5 py-0.5 rounded border border-[#222]">
                                  {m.type}
                                </span>
                              </div>
                              <span className="text-xs text-slate-300 block font-mono">{m.value}</span>
                              <span className="text-[9px] text-slate-500 block font-mono">{new Date(m.timestamp).toLocaleString()}</span>
                            </div>
                            <button
                              onClick={() => deleteMemory(m.id)}
                              className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 5: Security Audit Logs */}
            {/* ---------------------------------------------------- */}
            {activeTab === "logs" && (
              <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold font-display text-[#f0f0f0] flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-[#e2ff00]" />
                      <span>Security Audit logs</span>
                    </h3>
                    <p className="text-xs text-slate-500">Review real-time cybersecurity postures, token audits, and command validations.</p>
                  </div>
                  
                  {/* Severity Filter */}
                  <div className="flex space-x-2 text-xs font-mono">
                    <button
                      onClick={() => setFilterSeverity("all")}
                      className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${filterSeverity === "all" ? "bg-[#e2ff00] text-black font-bold" : "bg-[#0c0c0c] text-slate-400 border border-[#222]"}`}
                    >
                      All Logs
                    </button>
                    <button
                      onClick={() => setFilterSeverity("info")}
                      className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${filterSeverity === "info" ? "bg-[#e2ff00]/10 text-[#e2ff00] border border-[#e2ff00]/50 font-bold" : "bg-[#0c0c0c] text-slate-400 border border-[#222]"}`}
                    >
                      Info
                    </button>
                    <button
                      onClick={() => setFilterSeverity("warning")}
                      className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${filterSeverity === "warning" ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" : "bg-[#0c0c0c] text-slate-400 border border-[#222]"}`}
                    >
                      Warnings
                    </button>
                    <button
                      onClick={() => setFilterSeverity("critical")}
                      className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${filterSeverity === "critical" ? "bg-rose-500/20 text-rose-400 border border-rose-500/40" : "bg-[#0c0c0c] text-slate-400 border border-[#222]"}`}
                    >
                      Critical
                    </button>
                  </div>
                </div>

                {/* Log terminal */}
                <div className="flex-1 bg-[#0c0c0c] border border-[#222] rounded p-4 font-mono text-xs overflow-y-auto space-y-2">
                  {securityLogs
                    .filter((log) => filterSeverity === "all" || log.severity === filterSeverity)
                    .map((log, idx) => (
                      <div key={idx} className="flex items-start space-x-3 text-[11px] leading-relaxed border-b border-[#222]/50 pb-2">
                        <span className="text-slate-500 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className={`shrink-0 uppercase font-bold px-1.5 py-0.5 rounded text-[9px] ${log.severity === "critical" ? "bg-red-950 text-red-400 border border-red-500/30" : log.severity === "warning" ? "bg-amber-950 text-amber-400 border border-amber-500/30" : "bg-blue-950 text-blue-400 border border-blue-500/30"}`}>
                          {log.severity}
                        </span>
                        <span className="text-slate-400 shrink-0">[{log.source}]</span>
                        <div className="flex-1">
                          <span className="text-slate-200 font-bold block">{log.action}</span>
                          <span className="text-slate-400">{log.details}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 6: Trust & Legal Center */}
            {/* ---------------------------------------------------- */}
            {activeTab === "legal" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-5 border-b border-[#222] bg-[#0c0c0c]/90 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold font-display text-[#f0f0f0] flex items-center space-x-1.5">
                      <FileText className="h-4 w-4 text-[#e2ff00]" />
                      <span>Legal, Privacy, & trust documentation</span>
                    </h3>
                    <p className="text-xs text-slate-500">Official protective regulatory notices and medical/legal disclaimers.</p>
                  </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                  {/* Selectors */}
                  <div className="w-64 border-r border-[#222] bg-[#050505] p-4 space-y-2 shrink-0">
                    <span className="text-xs font-semibold text-slate-400 block mb-3 uppercase">Trust Documents</span>
                    {[
                      "TERMS_OF_SERVICE.md",
                      "PRIVACY_POLICY.md",
                      "SECURITY_WHITEPAPER.md",
                      "MEDICAL_LEGAL_DISCLAIMER.md"
                    ].map((docName) => (
                      <button
                        key={docName}
                        onClick={() => setSelectedLegalDoc(docName)}
                        className={`w-full text-left p-2.5 rounded text-xs font-mono transition-all flex items-center justify-between cursor-pointer border ${selectedLegalDoc === docName ? "bg-[#0c0c0c] text-[#e2ff00] border-[#e2ff00] shadow-[0_0_8px_rgba(226,255,0,0.1)] font-bold" : "text-[#999] hover:text-[#f0f0f0] border-transparent"}`}
                      >
                        <span className="truncate">{docName.replace(".md", "").replace("_", " ")}</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>

                  {/* Markdown Viewer */}
                  <div className="flex-1 bg-[#0c0c0c] p-6 overflow-y-auto space-y-4">
                    <div className="flex items-center justify-between border-b border-[#222] pb-3">
                      <span className="text-xs font-mono text-slate-500">Repository Path: /{selectedLegalDoc}</span>
                      <div className="flex space-x-2">
                        {/* Simulation download link */}
                        <a
                          href={`data:text/markdown;charset=utf-8,${encodeURIComponent(legalContent)}`}
                          download={selectedLegalDoc}
                          className="bg-[#050505] hover:bg-[#111] text-[#f0f0f0] text-xs font-mono py-1.5 px-3 rounded border border-[#222] flex items-center space-x-1.5 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5 text-[#e2ff00]" />
                          <span>Download MD</span>
                        </a>
                        <button
                          onClick={() => window.print()}
                          className="bg-[#e2ff00] hover:bg-[#cbe600] text-black text-xs font-mono py-1.5 px-3 rounded flex items-center space-x-1.5 font-bold transition-colors cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>Export PDF</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-sm font-sans text-slate-300 whitespace-pre-wrap leading-relaxed max-w-3xl">
                      {legalContent}
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>

          {/* Persistent global hardware diagnostic ribbon */}
          {hardware && (
            <footer className="border-t border-[#222] bg-[#0c0c0c] px-6 py-3 flex items-center justify-between text-xs text-slate-500 font-mono shrink-0">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1.5 text-[#e2ff00]">
                  <Check className="h-4 w-4 shadow-[0_0_8px_#e2ff00]" />
                  <span className="font-bold">Local Node Core Active</span>
                </div>
                <span>•</span>
                <span>CPU: {hardware.cpu} ({hardware.cores} Threads)</span>
                <span>•</span>
                <span>RAM: {hardware.freeRAM} free / {hardware.totalRAM} total</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1 text-slate-400">
                  <BatteryCharging className="h-4 w-4 text-[#e2ff00]" />
                  <span>Battery: {hardware.batteryState.level} ({hardware.batteryState.charging ? "Charging" : "Discharging"})</span>
                </span>
                <span>•</span>
                <span className="text-slate-500">Thermal: {hardware.thermalState}</span>
              </div>
            </footer>
          )}

        </div>
      </main>
    </div>
  );
}
