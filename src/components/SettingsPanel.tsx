import { useState, useEffect } from "react";
import { Sliders, KeyRound, CheckCircle, RefreshCw, AlertTriangle, Cpu, Save, Trash2, Eye, EyeOff, Sparkles } from "lucide-react";

interface SettingsPanelProps {
  apiKey: string;
  defaultModel: string;
  systemInstruction: string;
  onSave: (settings: { apiKey: string; defaultModel: string; systemInstruction: string }) => void;
  onClose: () => void;
  onClearDb: () => void;
}

export default function SettingsPanel({
  apiKey,
  defaultModel,
  systemInstruction,
  onSave,
  onClose,
  onClearDb,
}: SettingsPanelProps) {
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localModel, setLocalModel] = useState(defaultModel);
  const [localSysInstruction, setLocalSysInstruction] = useState(systemInstruction);
  const [showKey, setShowKey] = useState(false);
  
  const [verificationState, setVerificationState] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [verMessage, setVerMessage] = useState("");

  const handleApply = () => {
    onSave({
      apiKey: localApiKey.trim(),
      defaultModel: localModel,
      systemInstruction: localSysInstruction,
    });
    setVerificationState("idle");
  };

  const handleTestKeyConnection = async () => {
    if (!localApiKey.trim()) {
      setVerificationState("error");
      setVerMessage("API Key cannot be blank to conduct test.");
      return;
    }

    setVerificationState("verifying");
    setVerMessage("Initiating verification sequence against Gemini 3.5 Core...");

    try {
      const response = await fetch("/api/test-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-key": localApiKey.trim(),
        },
        body: JSON.stringify({ apiKey: localApiKey.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setVerificationState("success");
        setVerMessage(`CONNECTED: Core responds ready. State code: [${data.message}]`);
      } else {
        setVerificationState("error");
        setVerMessage(data.error || "Verification rejected. Verify key correct syntax.");
      }
    } catch (err: any) {
      setVerificationState("error");
      setVerMessage(err.message || "Network exception while targeting server endpoint.");
    }
  };

  return (
    <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-mono text-xs select-none">
      <div className="bg-white border-2 border-neutral-900 rounded max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Terminal Header */}
        <div className="bg-[#111111] text-white px-4 py-3 border-b-2 border-neutral-900 flex justify-between items-center bg-gradient-to-r from-neutral-950 to-neutral-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-neutral-300" />
            <span className="font-bold">SYSTEM_SHELL_CONFIGURATION</span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white font-bold px-1.5 hover:bg-neutral-800 rounded transition"
          >
            [X]
          </button>
        </div>

        {/* Modal Info Log */}
        <div className="bg-amber-50 border-b border-amber-200 p-3 leading-relaxed text-amber-900 flex gap-2.5 items-start">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-[10px]">
            <span className="font-bold uppercase text-amber-800 block mb-0.5">LOCAL_STORAGE_ENCRYPTION_ZONE</span>
            <span>All API keys and streams are written into your personal browser database (HTML5 LocalStorage). 
            They are exclusively kept on your device and routed server-side as strict session credentials. 
            No cloud-sync or remote logging occurs. No external credential leak possible.</span>
          </div>
        </div>

        {/* Modal Main Form Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* API Key Input Option */}
          <div className="space-y-1.5">
            <label className="font-bold text-neutral-800 flex items-center gap-1.5 uppercase tracking-wide">
              <KeyRound className="w-3.5 h-3.5 text-neutral-500" />
              <span>Personal Gemini API Key</span>
            </label>
            <div className="relative flex items-center border border-neutral-300 rounded bg-neutral-50 p-0.5">
              <input
                type={showKey ? "text" : "password"}
                placeholder={apiKey ? "API_KEY_PRESET (Stored forever)" : "AIzaSy... (Input your secure AI Studio Token)"}
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-neutral-900 outline-none placeholder-neutral-400 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1 px-2.5 hover:bg-neutral-200 text-neutral-500 rounded transition outline-none cursor-pointer border border-transparent active:border-neutral-300"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-neutral-500">
              <span>Required for coding requests. Leave blank to attempt server HOST key fallback.</span>
              <button
                type="button"
                onClick={handleTestKeyConnection}
                className="text-neutral-900 hover:text-neutral-950 font-bold underline cursor-pointer hover:bg-neutral-100 px-1 rounded transition"
              >
                [TEST_CONNECTION]
              </button>
            </div>
          </div>

          {/* Verification Console output log */}
          {verificationState !== "idle" && (
            <div className={`p-2.5 rounded border border-[#e4e4db] text-[10px] font-mono leading-relaxed ${
              verificationState === "verifying" ? "bg-amber-50 text-amber-800 border-amber-200" :
              verificationState === "success" ? "bg-green-50 text-green-800 border-green-200" :
              "bg-red-50 text-red-800 border-red-200"
            }`}>
              <div className="flex items-center gap-1.5 font-bold uppercase mb-1">
                {verificationState === "verifying" && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {verificationState === "success" && <CheckCircle className="w-3.5 h-3.5 text-green-600" />}
                {verificationState === "error" && <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
                <span>VERIFICATION_STABILITY_SHELL</span>
              </div>
              <p className="whitespace-pre-wrap">{verMessage}</p>
            </div>
          )}

          {/* Model selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-neutral-800 flex items-center gap-1.5 uppercase tracking-wide">
              <Cpu className="w-3.5 h-3.5 text-neutral-500" />
              <span>Default Kognitive Model Tier</span>
            </label>
            <select
              value={localModel}
              onChange={(e) => localModel !== e.target.value && setLocalModel(e.target.value)}
              className="w-full bg-[#fcfbf9] text-neutral-900 border border-neutral-300 rounded p-2 text-xs outline-none focus:border-neutral-600 font-mono cursor-pointer"
            >
              <option value="gemini-3.5-flash">Gemini 3.5 Flash — Standard Balanced (Recommended)</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview (Advanced Coder Context)</option>
            </select>
          </div>

          {/* System Instructions / Persona customization */}
          <div className="space-y-1.5">
            <label className="font-bold text-neutral-800 flex items-center gap-1.5 uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
              <span>AI System Coder Directives</span>
            </label>
            <textarea
              value={localSysInstruction}
              onChange={(e) => setLocalSysInstruction(e.target.value)}
              rows={4}
              placeholder="You are InterQua AI, a powerful real-time coder..."
              className="w-full bg-[#fcfbf9] text-neutral-900 border border-neutral-300 rounded p-2.5 text-xs outline-none focus:border-neutral-600 font-mono resize-none leading-relaxed"
            />
          </div>

          {/* Wipe Local Cache Database section */}
          <div className="pt-2 border-t border-neutral-200">
            <div className="flex items-center justify-between text-[11px]">
              <div>
                <span className="font-bold text-neutral-800 uppercase block mb-0.5">Flush Terminal Database</span>
                <span className="text-neutral-400">Purges local sessions cache permanently</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you absolutely sure you want to flush all conversations? This cannot be undone.")) {
                    onClearDb();
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 border border-red-300 text-red-700 hover:text-red-800 hover:bg-red-50 font-semibold rounded cursor-pointer transition select-none"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>FLUSH_DATABASE</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Submit Footer */}
        <div className="bg-[#f5f5ee] border-t border-neutral-300 p-3.5 flex justify-end gap-2 text-xs select-none">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-300 hover:border-neutral-400 bg-white hover:bg-neutral-50 rounded font-semibold cursor-pointer transition"
          >
            [CLOSE]
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-1 bg-[#1c1c1a] text-white hover:bg-neutral-800 py-2 px-4 rounded font-bold cursor-pointer transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>SAVE_SETTINGS_MUTATION</span>
          </button>
        </div>
      </div>
    </div>
  );
}
