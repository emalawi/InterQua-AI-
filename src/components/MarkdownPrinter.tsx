import React from "react";
import { Terminal, Copy, ArrowRight, CornerDownRight, Check, FileCode } from "lucide-react";

interface MarkdownPrinterProps {
  content: string;
  onCodeExport?: (code: string, language: string, title?: string) => void;
}

export default function MarkdownPrinter({ content, onCodeExport }: MarkdownPrinterProps) {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  if (!content) return null;

  const handleCopyCode = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Splitting text by code blocks to isolate code from commentary
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 font-mono text-xs text-neutral-800 leading-relaxed select-text">
      {parts.map((part, index) => {
        const isCodeBlock = part.startsWith("```") && part.endsWith("```");

        if (isCodeBlock) {
          // Extract information
          const match = part.match(/```(\w*)\s*([\w.-]*)\n([\s\S]*?)\n```/);
          const lang = match ? match[1] || "txt" : "txt";
          const filename = match && match[2] ? match[2].trim() : "";
          const code = match ? match[3] : part.slice(3, -3);
          const blockTitle = filename || `block_${index}.${lang}`;

          return (
            <div key={index} className="my-3 border border-[#d4d4cb] rounded bg-white overflow-hidden shadow-xs">
              {/* Code card header */}
              <div className="bg-[#f5f5ee] border-b border-[#d4d4cb] px-3 py-2 flex items-center justify-between font-bold text-[10px] text-neutral-600 select-none">
                <div className="flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{blockTitle.toUpperCase()} ({lang.toLowerCase()})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyCode(code, index)}
                    className="flex items-center gap-1 hover:text-neutral-950 hover:bg-neutral-200 px-1.5 py-0.5 rounded transition cursor-pointer"
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="w-3 h-3 text-green-600" />
                        <span className="text-green-600">COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>COPY</span>
                      </>
                    )}
                  </button>
                  {onCodeExport && (
                    <button
                      onClick={() => onCodeExport(code, lang, blockTitle)}
                      className="text-[#0066cc] hover:underline hover:bg-[#e4e4db] px-1.5 py-0.5 rounded transition ml-1 cursor-pointer flex items-center gap-0.5 font-bold"
                    >
                      <span>MOUNT_CANVAS</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Code content layout box */}
              <div className="overflow-x-auto p-3 text-[11px] leading-relaxed select-text bg-[#fcfbf9] text-neutral-900 border-l-2 border-neutral-700">
                <pre className="font-mono">{code}</pre>
              </div>
            </div>
          );
        } else {
          // Process standard text line-by-line for basic formatting
          const lines = part.split("\n");
          return (
            <div key={index} className="space-y-1.5">
              {lines.map((line, lIdx) => {
                const trimmed = line.trim();
                
                // Bullet points
                if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2 pl-2">
                      <CornerDownRight className="w-3 h-3 text-neutral-400 mt-1 flex-shrink-0" />
                      <span className="flex-1">{parseInline(line.substring(line.indexOf("-") + 1).trim())}</span>
                    </div>
                  );
                }

                // Headers
                if (trimmed.startsWith("#")) {
                  const level = (trimmed.match(/^#+/) || ["#"])[0].length;
                  const titleText = trimmed.replace(/^#+\s*/, "");
                  const sizeClass = level === 1 ? "text-sm font-extrabold text-neutral-950 tracking-tight" : "text-xs font-bold text-neutral-900";
                  return (
                    <div key={lIdx} className={`pt-2 pb-1 border-b border-[#e4e4db] ${sizeClass}`}>
                      ::: {titleText.toUpperCase()} :::
                    </div>
                  );
                }

                // Normal paragraph lines
                if (trimmed === "") return <div key={lIdx} className="h-1.5" />;
                return <p key={lIdx} className="leading-relaxed select-text text-[11.5px]">{parseInline(line)}</p>;
              })}
            </div>
          );
        }
      })}
    </div>
  );
}

// Simple inline styling regex parser for **bold** and `code`
function parseInline(text: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const parts = text.split(regex);
  
  parts.forEach((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      tokens.push(<strong key={i} className="font-extrabold text-neutral-950 font-mono">{part.slice(2, -2)}</strong>);
    } else if (part.startsWith("`") && part.endsWith("`")) {
      tokens.push(<code key={i} className="px-1 py-0.5 bg-[#f5f5ee] border border-[#d4d4cb] rounded text-[11px] text-zinc-900 font-mono font-bold">{part.slice(1, -1)}</code>);
    } else {
      tokens.push(part);
    }
  });

  return tokens.length > 0 ? tokens : [text];
}
