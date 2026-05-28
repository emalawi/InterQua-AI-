import { useState } from "react";
import { FolderGit, MessageSquare, Plus, Trash2, Sliders, Server, Cpu, Database, Command, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Conversation } from "../types";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  activeModel: string;
  onModelChange: (model: string) => void;
  onToggleSettings: () => void;
  hasApiKey: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  activeModel,
  onModelChange,
  onToggleSettings,
  hasApiKey,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (collapsed) {
    return (
      <div className="w-[48px] bg-[#fdfdfc] border-r border-[#d4d4cb] flex flex-col items-center py-4 justify-between font-mono text-neutral-800 transition-all duration-300">
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-[#e4e4db] rounded border border-neutral-300 title-hint"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={onNew}
            className="p-1.5 bg-neutral-900 text-white hover:bg-neutral-800 rounded flex items-center justify-center transition"
            title="New stream [Ctrl+N]"
          >
            <Plus className="w-4 h-4" />
          </button>

          <div className="h-px w-6 bg-neutral-300 my-1" />

          {conversations.slice(0, 6).map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`p-1.5 rounded transition relative flex items-center justify-center ${
                c.id === activeId 
                  ? "bg-neutral-200 border border-neutral-400" 
                  : "hover:bg-neutral-100 border border-transparent"
              }`}
              title={c.title}
            >
              <MessageSquare className="w-4 h-4" />
              {c.id === activeId && (
                <span className="absolute right-0 top-1 w-1.5 h-1.5 bg-green-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={onToggleSettings}
            className={`p-1.5 rounded border ${
              hasApiKey ? "border-green-300 bg-green-50 text-green-800" : "border-amber-300 bg-amber-50 text-amber-800"
            }`}
            title="Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-[#fcfbf9] border-r border-[#d4d4cb] flex flex-col h-full font-mono text-xs text-neutral-800 transition-all duration-300 select-none">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-[#e4e4db] flex justify-between items-center bg-[#f5f5ee]">
        <div className="flex items-center gap-1.5 font-bold tracking-tight text-neutral-900">
          <FolderGit className="w-4 h-4 text-neutral-700" />
          <span>SESSION_EXPLORER</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-[#e4e4db] rounded border border-transparent hover:border-neutral-300"
          title="Collapse Sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Connection Mode Indicator */}
      <div className="p-3 bg-white border-b border-[#e4e4db] flex items-center justify-between text-[11px] font-semibold text-neutral-600">
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${hasApiKey ? "bg-green-500 animate-pulse" : "bg-amber-500 animate-pulse"}`} />
          <span>{hasApiKey ? "HOST_KEY_LOADED" : "FALLBACK_MODE"}</span>
        </div>
        <div className="text-[10px] text-neutral-400">
          SECURE_SSL: TRUE
        </div>
      </div>

      {/* New Run Button */}
      <div className="p-3">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#111111] text-white hover:bg-neutral-800 active:bg-neutral-900 border border-neutral-800 hover:border-neutral-900 rounded font-bold cursor-pointer transition text-[11px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>SPAWN_NEW_STREAM</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="px-3 pb-3">
        <div className="relative border border-[#d4d4cb] rounded bg-white">
          <span className="absolute left-2.5 top-2 text-neutral-400">$</span>
          <input
            type="text"
            placeholder="grep find stream..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-6 pr-2 py-1.5 text-xs bg-transparent text-neutral-900 outline-none placeholder-neutral-400 font-mono"
          />
        </div>
      </div>

      {/* Stored Conversations */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        <div className="text-[10px] font-semibold text-neutral-400 px-2 my-1 uppercase tracking-wider flex items-center justify-between">
          <span>Active Nodes ({filteredConversations.length})</span>
          <Database className="w-3 h-3" />
        </div>

        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 border border-dashed border-neutral-200 rounded mx-2 bg-neutral-50/50">
            <span className="block mb-1">[No matches found]</span>
            <span className="text-[10px]">Execute spawn prompt.</span>
          </div>
        ) : (
          filteredConversations.map((c) => {
            const isActive = c.id === activeId;
            return (
              <div
                key={c.id}
                className={`group flex items-center justify-between rounded p-2 transition border ${
                  isActive
                    ? "bg-neutral-200 border-neutral-400 text-neutral-950 font-semibold"
                    : "bg-transparent border-transparent text-neutral-700 hover:bg-[#f5f5ee] hover:text-neutral-900"
                }`}
              >
                <button
                  onClick={() => onSelect(c.id)}
                  className="flex-1 text-left truncate flex items-center gap-2 pr-1"
                >
                  <MessageSquare className="w-3.5 h-3.5 opacity-70 flex-shrink-0" />
                  <span className="truncate">{c.title || "Untitled stream"}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(c.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-neutral-300 hover:text-red-600 rounded transition text-neutral-500"
                  title="Delete Stream Node"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Model Controls */}
      <div className="p-3 border-t border-[#e4e4db] bg-[#fdfdfc]">
        <div className="mb-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
          <Cpu className="w-3 h-3" />
          <span>KOGNITIVE_CORES_SELECTION</span>
        </div>
        <div className="grid grid-cols-2 gap-1 bg-[#f5f5ee] p-1 border border-[#d4d4cb] rounded">
          <button
            onClick={() => onModelChange("gemini-3.5-flash")}
            className={`py-1 text-[10px] font-semibold rounded text-center transition cursor-pointer ${
              activeModel === "gemini-3.5-flash"
                ? "bg-white text-neutral-950 shadow-sm border border-neutral-300"
                : "text-neutral-500 hover:text-neutral-950"
            }`}
          >
            3.5-FLASH
          </button>
          <button
            onClick={() => onModelChange("gemini-3.1-pro-preview")}
            className={`py-1 text-[10px] font-semibold rounded text-center transition cursor-pointer ${
              activeModel === "gemini-3.1-pro-preview"
                ? "bg-white text-neutral-950 shadow-sm border border-neutral-300"
                : "text-neutral-500 hover:text-neutral-950"
            }`}
          >
            3.1-PRO (CODER)
          </button>
        </div>
      </div>

      {/* Footer Settings and Credits */}
      <div className="p-3 border-t border-[#e4e4db] bg-[#f5f5ee] flex items-center justify-between">
        <button
          onClick={onToggleSettings}
          className="flex items-center gap-1 text-[11px] font-semibold text-neutral-700 hover:text-neutral-950 cursor-pointer bg-white border border-[#d4d4cb] hover:border-neutral-400 active:bg-neutral-50 py-1.5 px-2.5 rounded shadow-sm transition"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>CONFIG_SHELL</span>
        </button>

        <div className="flex items-center gap-1 text-[10px] text-neutral-400 uppercase">
          <Server className="w-3 h-3 text-neutral-400" />
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  );
}
