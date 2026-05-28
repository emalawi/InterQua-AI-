import { useState, useEffect, useRef, useTransition, FormEvent, KeyboardEvent } from "react";
import { 
  Terminal, 
  Settings, 
  Cpu, 
  Send, 
  BookOpen, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  ShieldCheck, 
  ChevronRight, 
  Command, 
  Key, 
  FolderLock,
  Search,
  CheckCircle,
  FileCode,
  SlidersHorizontal,
  FolderSync
} from "lucide-react";
import { Conversation, Message, AppSettings } from "./types";
import Sidebar from "./components/Sidebar";
import CodeCanvas from "./components/CodeCanvas";
import SettingsPanel from "./components/SettingsPanel";
import MarkdownPrinter from "./components/MarkdownPrinter";

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: "",
  defaultModel: "gemini-3.5-flash",
  systemInstruction: "You are InterQua AI, a powerful real-time terminal coding assistant. You write perfect, elegantly commented code, provide syntax details inside structured code blocks, and output technical guides in clear, crisp, and concise markdown."
};

const INITIAL_CONVERSATION_ID = "node-genesis";

const INTRO_CONVERSATION: Conversation = {
  id: INITIAL_CONVERSATION_ID,
  title: "GENESIS_NODE",
  createdAt: Date.now(),
  activeModel: "gemini-3.5-flash",
  messages: [
    {
      id: "msg-i1",
      role: "user",
      content: "$ init --interqua-system",
      timestamp: Date.now() - 60000,
      isCommand: true
    },
    {
      id: "msg-i2",
      role: "model",
      content: `# INTERACTIVE TERMINAL CODE COMPILER ONLINE

Welcome to **InterQua AI** [Version 1.0.4]. I am your dedicated coding workspace node powered by Gemini Generative Core. Use my framework to generate scripts, debug, inspect compile streams, and play around in the sandbox.

### CORE COMMAND SHORTCUTS
- \`/help\` — Inspect terminal quick commands
- \`/clear\` — Flush active terminal logging screen
- \`/key [key]\` — Update secure API key in local browser database
- \`/model [3.5-flash|3.1-pro]\` — Toggle core processor
- \`/info\` — Fetch connection status specs

### PLAYGROUND EXPERIMENTATION
Let us begin. Enter a programming inquiry below or click a quick prompt template:
`,
      timestamp: Date.now() - 50000
    }
  ]
};

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem("interqua_conversations");
    return saved ? JSON.parse(saved) : [INTRO_CONVERSATION];
  });
  
  const [activeId, setActiveId] = useState<string | null>(() => {
    const saved = localStorage.getItem("interqua_conversations");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed[0]?.id || INITIAL_CONVERSATION_ID;
    }
    return INITIAL_CONVERSATION_ID;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem("interqua_settings");
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [canvasCollapsed, setCanvasCollapsed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[ONLINE] InterQua Core Kernel initialized.",
    "[SECURE] localStorage sandbox verified. Core DB active."
  ]);
  const [showLogTerminal, setShowLogTerminal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state to local database permanently
  useEffect(() => {
    localStorage.setItem("interqua_conversations", JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem("interqua_settings", JSON.stringify(settings));
  }, [settings]);

  // Focus terminal input
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeId]);

  // Auto scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeId, isGenerating]);

  const activeConv = conversations.find(c => c.id === activeId) || conversations[0];

  // Helper file extension derivation
  function getFileExtension(lang: string): string {
    switch (lang.toLowerCase()) {
      case 'javascript':
      case 'js': return 'js';
      case 'typescript':
      case 'ts': return 'ts';
      case 'python':
      case 'py': return 'py';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'rust':
      case 'rs': return 'rs';
      case 'cpp': return 'cpp';
      default: return 'txt';
    }
  }

  // Calculate parsed code blocks reactively from current conversation
  const codeBlocks: { language: string; code: string; title: string }[] = [];
  if (activeConv) {
    activeConv.messages.forEach(msg => {
      if (msg.role === 'model' && msg.content) {
        const regex = /```(\w*)\s*([\w.-]*)\n([\s\S]*?)\n```/g;
        let match;
        let index = 1;
        while ((match = regex.exec(msg.content)) !== null) {
          const language = match[1] || "txt";
          const rawTitle = match[2]?.trim();
          const code = match[3] || "";
          const title = rawTitle || `script_${index}.${getFileExtension(language)}`;
          
          // Avoid duplicate display files with same title and contents
          if (!codeBlocks.some(b => b.title === title && b.code === code)) {
            codeBlocks.push({ language, code, title });
          }
          index++;
        }
      }
    });
  }

  const handleSelectConv = (id: string) => {
    setActiveId(id);
    addTerminalLog(`$ cd session://node-${id}`);
  };

  const handleSpawnNewStream = () => {
    const newId = `node-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: `NODE_${conversations.length + 1}_STND`,
      createdAt: Date.now(),
      activeModel: settings.defaultModel,
      messages: [
        {
          id: `msg-${Date.now()}-greet`,
          role: "model",
          content: "# SPAWNED NEW COGNITIVE TERMINAL STREAM\nReady for input directives. Type `/help` for system command references.",
          timestamp: Date.now()
        }
      ]
    };

    setConversations(prev => [newConv, ...prev]);
    setActiveId(newId);
    addTerminalLog(`$ spawn-stream -t standard`);
  };

  const handleDeleteConv = (id: string) => {
    if (conversations.length <= 1) {
      alert("Terminal core requires at least one active console node stream.");
      return;
    }
    const filtered = conversations.filter(c => c.id !== id);
    setConversations(filtered);
    if (activeId === id) {
      setActiveId(filtered[0]?.id || INITIAL_CONVERSATION_ID);
    }
    addTerminalLog(`$ rm-stream --ref ${id}`);
  };

  const handleClearDb = () => {
    localStorage.removeItem("interqua_conversations");
    localStorage.removeItem("interqua_settings");
    setConversations([INTRO_CONVERSATION]);
    setActiveId(INITIAL_CONVERSATION_ID);
    setSettings(DEFAULT_SETTINGS);
    setShowSettings(false);
    addTerminalLog(`$ db-sync --purge-all --flush`);
  };

  const handleSettingsSave = (newSettings: AppSettings) => {
    setSettings(newSettings);
    setShowSettings(false);
    addTerminalLog(`$ sys-config --write --model ${newSettings.defaultModel}`);
  };

  const addTerminalLog = (log: string) => {
    setTerminalLogs(prev => [...prev.slice(-49), `[${new Date().toLocaleTimeString()}] ${log}`]);
  };

  // Triggered when a user clicks 'MOUNT TO CANVAS' button in any Markdown Code card
  const handleMountCanvasCode = (code: string, language: string, title?: string) => {
    // Simply logging mounting action
    addTerminalLog(`$ mount-code --src ${title || "canvas_snippet"}`);
    alert(`Code snippet successfully compiled and targeted on the interactive CANVAS FILES selector! Close the chat or inspect the right-panel to run, edit, or simulation execute.`);
  };

  const handleTerminalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const query = input.trim();
    setInput("");
    setHistoryIndex(-1);
    
    // Save to prompt history
    setCmdHistory(prev => [query, ...prev.filter(q => q !== query)].slice(0, 30));

    // Append standard user query as message
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: query,
      timestamp: Date.now(),
      isCommand: query.startsWith("/")
    };

    // Update active conversation locally
    let updatedMsgs = [...activeConv.messages, userMsg];
    
    setConversations(prev => prev.map(c => 
      c.id === activeConv.id ? { ...c, messages: updatedMsgs } : c
    ));

    // Handle interactive local commands immediately
    if (query.startsWith("/")) {
      handleLocalCommand(query, updatedMsgs);
      return;
    }

    // Call server API for remote Gemini execution
    setIsGenerating(true);
    addTerminalLog(`$ gemini-stream --prompt "${query.slice(0, 15)}..."`);

    // Prepare receiver/model message
    const modelMsgId = `msg-${Date.now()}-model`;
    const modelMsg: Message = {
      id: modelMsgId,
      role: "model",
      content: "⚡ target connected... pipeline open",
      timestamp: Date.now()
    };

    setConversations(prev => prev.map(c => 
      c.id === activeConv.id ? { ...c, messages: [...updatedMsgs, modelMsg] } : c
    ));

    try {
      const response = await fetch("/api/chat-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-key": settings.apiKey,
        },
        body: JSON.stringify({
          message: query,
          history: activeConv.messages.filter(m => !m.isCommand), // remove system local command calls from history
          model: activeConv.activeModel || settings.defaultModel,
          systemInstruction: settings.systemInstruction
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP pipeline crash [Code: ${response.status}]`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = "";

      while (!done) {
        const { value, done: doneReading } = await reader!.read();
        done = doneReading;
        const chunk = decoder.decode(value, { stream: !done });
        
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") {
              break;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                throw new Error(data.error);
              }
              if (data.text) {
                accumulatedText += data.text;
                // Live updates conversation messages state
                setConversations(prev => prev.map(c => {
                  if (c.id === activeConv.id) {
                    return {
                      ...c,
                      messages: c.messages.map(m => 
                        m.id === modelMsgId ? { ...m, content: accumulatedText } : m
                      )
                    };
                  }
                  return c;
                }));
              }
            } catch (err) {
              // Ignore single partial json chunk read errors
            }
          }
        }
      }

      // Auto update active stream title based on query if simple name
      if (activeConv.title.startsWith("NODE_") || activeConv.title === "GENESIS_NODE") {
        const wordMatch = query.replace(/^\W+/, "").split(/\s+/).slice(0, 3).join("_").toUpperCase();
        if (wordMatch) {
          setConversations(prev => prev.map(c => 
            c.id === activeConv.id ? { ...c, title: `${wordMatch.slice(0, 16)}` } : c
          ));
        }
      }

    } catch (error: any) {
      console.error(error);
      addTerminalLog(`[ERR] Stream crash: ${error.message}`);
      setConversations(prev => prev.map(c => {
        if (c.id === activeConv.id) {
          return {
            ...c,
            messages: c.messages.map(m => 
              m.id === modelMsgId ? { ...m, content: `### ❌ CONNECTION BREAK\n\n${error.message || "An expected error has corrupted the socket connection pipeline."}\n\n*Check that you have saved a correct Gemini API Key in the settings configuration panel.*` } : m
            )
          };
        }
        return c;
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  // Local helper command parser bypassed from Gemini AI API
  const handleLocalCommand = (cmdStr: string, currentHistory: Message[]) => {
    const args = cmdStr.split(/\s+/);
    const cmd = args[0].toLowerCase();

    let outputText = "";
    addTerminalLog(`$ run-local ${cmd}`);

    switch (cmd) {
      case "/help":
        outputText = `# INTERQUA SYSTEM CONTROL UTILITY HELP

Ready instructions and environment triggers:
- \`/help\` — Display this documentation board.
- \`/clear\` — Wipe the terminal screen (keeps node stream history pristine).
- \`/model [3.5-flash | 3.1-pro]\` — Safely switch cognitive models.
- \`/key [API_KEY]\` — Instantly bind Gemini API token to localStorage.
- \`/info\` — Retrieve connection hardware coordinates and specifications.
- \`/code\` — Collapse/Expand canvas editor interface.
- \`/genesis\` — Mount genesis stream documentation.
`;
        break;

      case "/clear":
        // Clears conversations displayed on the screen for the current session only
        setConversations(prev => prev.map(c => 
          c.id === activeConv.id ? { ...c, messages: [] } : c
        ));
        addTerminalLog("$ clear-screen");
        return;

      case "/key":
        if (!args[1]) {
          outputText = `[SYSTEM] Missing argument parameter. Syntax format: \`/key AIzaSyYourKeyHere\``;
        } else {
          const newKey = args[1].trim();
          setSettings(prev => ({ ...prev, apiKey: newKey }));
          outputText = `[SYSTEM] API key written successfully into local secure database! Binding complete. You can now execute coding queries directly.`;
          addTerminalLog("$ sys-key --write-local");
        }
        break;

      case "/model":
        const targetModel = args[1]?.toLowerCase();
        if (targetModel === "3.5-flash" || targetModel === "flash" || targetModel === "gemini-3.5-flash") {
          setConversations(prev => prev.map(c => 
            c.id === activeConv.id ? { ...c, activeModel: "gemini-3.5-flash" } : c
          ));
          outputText = `[SYSTEM] Processor core migrated to: **Gemini 3.5 Flash**`;
          addTerminalLog("$ system-core --scale 3.5-flash");
        } else if (targetModel === "3.1-pro" || targetModel === "pro" || targetModel === "gemini-3.1-pro-preview") {
          setConversations(prev => prev.map(c => 
            c.id === activeConv.id ? { ...c, activeModel: "gemini-3.1-pro-preview" } : c
          ));
          outputText = `[SYSTEM] Processor core migrated to: **Gemini 3.1 Pro (Heavy Coding Coder Model)**`;
          addTerminalLog("$ system-core --scale 3.1-pro");
        } else {
          outputText = `[SYSTEM] Core target mismatch. Valid arguments: '3.5-flash', '3.1-pro'`;
        }
        break;

      case "/info":
        outputText = `# ENVIRONMENT SPECIFICATIONS COORDINATES

- **Host Domain**: Location context ssl terminal
- **Server Platform**: Google Cloud Sandbox
- **Memory Frame**: Allocated host thread 512MB Cgroup
- **Client Secure Database**: localStorage [DB_ENABLED: TRUE]
- **API Target Key**: ${settings.apiKey ? "LOADED (***" + settings.apiKey.slice(-5) + ")" : "MISSING (FALLBACK_MODE)"}
- **Default Core Node**: ${activeConv.activeModel || settings.defaultModel}
- **HMR Status**: DISABLE_HMR_DEFERRED
`;
        break;

      case "/code":
        setCanvasCollapsed(!canvasCollapsed);
        outputText = `[SYSTEM] CodeCanvas visualization state toggled. Code panel currently: ${!canvasCollapsed ? "VISIBLE" : "COLLAPSED"}`;
        break;

      case "/genesis":
        setConversations(prev => prev.map(b => b.id === activeConv.id ? INTRO_CONVERSATION : b));
        return;

      default:
        outputText = `[SYSTEM] Unrecognized internal command '${cmd}'. Enter \`/help\` for documentation.`;
    }

    const sysResponse: Message = {
      id: `msg-${Date.now()}-local-response`,
      role: "model",
      content: outputText,
      timestamp: Date.now()
    };

    setConversations(prev => prev.map(c => 
      c.id === activeConv.id ? { ...c, messages: [...currentHistory, sysResponse] } : c
    ));
  };

  // Keyboard prompts command navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      
      const nextIdx = historyIndex + 1;
      if (nextIdx < cmdHistory.length) {
        setHistoryIndex(nextIdx);
        setInput(cmdHistory[nextIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = historyIndex - 1;
      if (nextIdx >= 0) {
        setHistoryIndex(nextIdx);
        setInput(cmdHistory[nextIdx]);
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#fafaf9] overflow-hidden text-neutral-800 font-mono selection:bg-neutral-200">
      
      {/* Absolute Application Settings Panel */}
      {showSettings && (
        <SettingsPanel
          apiKey={settings.apiKey}
          defaultModel={settings.defaultModel}
          systemInstruction={settings.systemInstruction}
          onSave={handleSettingsSave}
          onClose={() => setShowSettings(false)}
          onClearDb={handleClearDb}
        />
      )}

      {/* Terminal Grid Panel Shell Header Bar */}
      <div className="h-11 bg-neutral-900 text-white flex items-center justify-between px-4 border-b-2 border-neutral-950 select-none shadow-md">
        <div className="flex items-center gap-2">
          {/* Virtual traffic light terminals */}
          <div className="flex gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-red-600 block" />
            <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500 block" />
            <span className="w-3 h-3 rounded-full bg-green-500 border border-green-600 block" />
          </div>
          <Command className="w-4 h-4 text-neutral-300" />
          <h1 className="font-bold tracking-tight text-xs flex items-center gap-1.5">
            <span>InterQua AI</span>
            <span className="bg-neutral-800 text-[9px] text-[#4af626] font-extrabold px-1.5 py-0.5 rounded tracking-widest leading-none border border-neutral-700">SHELL_VM</span>
          </h1>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-[10px] text-neutral-400 font-semibold uppercase">
          <div className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-[#00ffcc]" />
            <span>MODEL: {activeConv.activeModel || settings.defaultModel}</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            <span>DATABASE: LOCAL_ACTIVE</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLogTerminal(!showLogTerminal)}
            className={`text-[10px] font-bold px-2 py-1 rounded border transition flex items-center gap-1 cursor-pointer ${
              showLogTerminal 
                ? "bg-neutral-700 text-green-300 border-neutral-600" 
                : "bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white"
            }`}
          >
            <FolderSync className="w-3.5 h-3.5" />
            <span>CORE_LOGS</span>
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition border border-transparent hover:border-neutral-700 cursor-pointer"
            title="Open Config Shell"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main workspace layout split */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Workspace Sidebar of streams */}
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelectConv}
          onNew={handleSpawnNewStream}
          onDelete={handleDeleteConv}
          activeModel={activeConv.activeModel || settings.defaultModel}
          onModelChange={(model) => {
            const nextConv = conversations.map(c => 
              c.id === activeConv.id ? { ...c, activeModel: model } : c
            );
            setConversations(nextConv);
            addTerminalLog(`$ config model --set ${model}`);
          }}
          onToggleSettings={() => setShowSettings(!showSettings)}
          hasApiKey={!!settings.apiKey}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Visual Middle Space Container for log and shell panels */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* Optional System Log Panel details sliding */}
          {showLogTerminal && (
            <div className="bg-[#181817] border-b-2 border-neutral-900 p-3 h-40 overflow-y-auto text-[#00ff66] font-mono text-[10px] space-y-1 relative shadow-inner select-text">
              <div className="absolute right-4 top-2 text-[9px] px-1.5 py-0.5 bg-neutral-800 text-neutral-400 border border-neutral-700 font-bold uppercase select-none">
                SYS_KERNEL_STREAM
              </div>
              {terminalLogs.map((log, idx) => (
                <div key={idx} className="whitespace-pre truncate leading-normal">
                  {log}
                </div>
              ))}
            </div>
          )}

          {/* Core Dialogue Output terminal canvas */}
          <div className="flex-1 overflow-y-auto bg-white p-4 space-y-4 flex flex-col relative select-text">
            {activeConv.messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-neutral-400 p-8 font-mono select-none">
                <Terminal className="w-12 h-12 text-neutral-300 mb-2.5 animate-pulse" />
                <p className="font-bold uppercase text-neutral-500 text-[11px]">Stream stdout buffer cleared.</p>
                <p className="text-[10px] mt-1 max-w-xs">Type dialogue prompts or execute `/genesis` command to recover.</p>
              </div>
            ) : (
              activeConv.messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id || index}
                    className={`flex flex-col max-w-4xl w-full mx-auto ${
                      isUser ? "items-start border-l-2 border-neutral-800 pl-4 bg-neutral-50/50 py-1" : "items-start pt-2"
                    }`}
                  >
                    {/* Timestamp / User Tag line */}
                    <div className="flex items-center gap-2 text-[10px] text-neutral-400 mb-1 select-none font-bold uppercase">
                      {isUser ? (
                        <span className="text-neutral-700">$ user@interqua-cli</span>
                      ) : (
                        <span className="text-[#0066cc]"># interqua-ai@node</span>
                      )}
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>

                    {/* Content formatted */}
                    <div className="w-full text-xs text-neutral-900 leading-relaxed font-mono whitespace-pre-wrap select-text">
                      {isUser ? (
                        <div className="font-bold text-neutral-900 pl-1 select-text h-auto">
                          {msg.content}
                        </div>
                      ) : (
                        <MarkdownPrinter 
                          content={msg.content} 
                          onCodeExport={handleMountCanvasCode} 
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isGenerating && (
              <div className="flex items-center gap-2 text-xs text-neutral-400 max-w-4xl [w-full] mx-auto w-full select-none pl-1">
                <RefreshCw className="w-4 h-4 animate-spin text-[#0066cc]" />
                <span className="font-bold uppercase text-[10px] tracking-wider animate-pulse">interqua compilation pipeline streaming...</span>
              </div>
            )}

            <div ref={terminalEndRef} />
          </div>

          {/* Quick prompt suggestions triggers */}
          <div className="bg-white border-t border-[#d4d4cb] px-4 py-2 hidden md:flex gap-1.5 select-none text-[10px] font-mono text-neutral-600 overflow-x-auto no-scrollbar">
            <span className="font-bold text-neutral-400 flex items-center mr-1">PRESETS:</span>
            {[
              { label: "Python Web Scraper", q: "Write a python web scraper script using beautifulsoup and request with error handling" },
              { label: "HTML Terminal UI", q: "Write a single-file elegant HTML responsive index page featuring high contrast dark/light themes" },
              { label: "Regex Parser JS", q: "Write a high-performance JavaScript ES6 function to parse Markdown content and split code blocks cleanly" },
              { label: "Fastify Server TS", q: "Write a solid Fastify server script in TypeScript featuring custom API route error handlers" }
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInput(p.q)}
                className="px-2.5 py-1.5 bg-[#f5f5ee] border border-[#d4d4cb] hover:border-neutral-400 rounded transition cursor-pointer hover:bg-neutral-100 flex-shrink-0"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* CLI input terminal submit form */}
          <form
            onSubmit={handleTerminalSubmit}
            className="border-t-2 border-neutral-900 bg-neutral-900 px-4 py-3 flex items-center gap-3 select-none"
          >
            <span className="text-[#4af626] font-extrabold text-sm ml-1 select-none">$</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Type system commands or ask coding instructions..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              className="flex-1 bg-transparent border-0 outline-none text-[#ffffff] font-mono text-xs placeholder-neutral-500 disabled:opacity-50 select-text"
              spellCheck="false"
              autoComplete="off"
            />
            
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCanvasCollapsed(!canvasCollapsed)}
                className={`p-1 border rounded transition cursor-pointer hidden sm:block ${
                  !canvasCollapsed 
                    ? "bg-neutral-800 border-neutral-700 text-white" 
                    : "bg-transparent border-neutral-800 text-neutral-400 hover:text-white"
                }`}
                title="Toggle Code Canvas [Ctrl+B]"
              >
                {!canvasCollapsed ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="submit"
                disabled={isGenerating || !input.trim()}
                className="p-1 px-3 bg-white hover:bg-neutral-100 disabled:bg-neutral-800 text-neutral-900 disabled:text-neutral-600 rounded transition font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>EXEC_RUN</span>
              </button>
            </div>
          </form>
        </div>

        {/* Visual Code Canvas panel displaying blocks side by side */}
        {!canvasCollapsed && (
          <div className="w-[45vw] lg:w-[48vw] xl:w-[50vw] h-full flex flex-col border-l border-[#d4d4cb] bg-white transition-all duration-300">
            <CodeCanvas codeBlocks={codeBlocks} activeBlocks={codeBlocks} />
          </div>
        )}

      </div>
    </div>
  );
}
