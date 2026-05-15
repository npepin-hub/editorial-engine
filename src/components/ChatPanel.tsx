"use client";
import { useRef, useEffect, useState } from "react";
import type { UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function BriefThumbnail() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="block w-full h-full text-left group relative"
        title="Click to expand"
      >
        <img
          src="/briefOutput.svg"
          alt="Example content brief output"
          className="w-full h-full object-contain object-top rounded-lg border border-zinc-100 group-hover:border-zinc-300 transition-colors opacity-80 group-hover:opacity-100"
        />
        <span className="absolute bottom-2 right-2 text-[10px] font-mono text-zinc-500 bg-white px-1.5 py-0.5 rounded border border-zinc-200 shadow-sm">
          expand ↗
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-8"
          onClick={() => setOpen(false)}
        >
          <img
            src="/briefOutput.svg"
            alt="Example content brief output"
            className="max-w-4xl w-full max-h-full object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setOpen(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white text-sm font-mono"
          >
            ✕ close
          </button>
        </div>
      )}
    </>
  );
}

interface ChatPanelProps {
  messages: UIMessage[];
  onSend: (text: string) => void;
  onResetChat: () => void;
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChatPanel({ messages, onSend, onResetChat }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasContent = messages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="w-1/2 flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-start justify-between">
        <div>
          <p className="text-xl font-mono font-bold text-zinc-900 uppercase tracking-widest mb-1">Editorial</p>
          <p className="text-sm text-zinc-500">Refine results, dig into a topic, or request a full content brief.</p>
        </div>
        {hasContent && (
          <button
            onClick={onResetChat}
            className="text-[10px] font-mono text-zinc-400 hover:text-zinc-700 transition-colors flex-shrink-0 mt-0.5"
          >
            Reset
          </button>
        )}
      </div>

      {/* Messages */}
      <div className={`flex-1 min-h-0 px-6 ${hasContent ? "overflow-y-auto space-y-6 py-2" : "flex flex-col overflow-hidden pb-6"}`}>
        {!hasContent && (
          <div className="h-full flex flex-col gap-4 py-2">
            <div className="space-y-2 flex-shrink-0">
              <p className="text-base font-semibold text-zinc-900">Your editorial partner</p>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Once research runs, ranked topics appear on the left. Come here to refine the list, swap ideas, explore a topic in depth, or generate a full content brief.
              </p>
            </div>

            <div className="space-y-2 flex-shrink-0">
              <span className="text-xs font-mono font-semibold text-zinc-600 uppercase tracking-wider">Try asking</span>
              <ul className="space-y-1.5">
                {[
                  "Tell me more about topic #2.",
                  "Swap #4 for something more beginner-friendly.",
                  "Generate a full brief for the top topic.",
                  "Which topics would work as a tutorial series?",
                ].map((prompt, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="text-[10px] font-mono text-zinc-400 mt-0.5 flex-shrink-0 w-4">{i + 1}</span>
                    <span className="text-sm text-zinc-500 leading-relaxed">{prompt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-shrink-0">
              <span className="text-xs font-mono font-semibold text-zinc-600 uppercase tracking-wider block mb-2">Example brief output</span>
              <div className="h-44">
                <BriefThumbnail />
              </div>
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`space-y-1.5 ${msg.role === "user" ? "items-end flex flex-col" : ""}`}>
            <span className="text-xs font-mono font-semibold text-zinc-600 uppercase tracking-wider">
              {msg.role === "user" ? "You" : "Editorial"}
            </span>
            <div className={`text-sm leading-relaxed max-w-[88%] ${
              msg.role === "user"
                ? "bg-zinc-100 text-zinc-900 rounded-2xl rounded-tr-sm px-4 py-2.5 whitespace-pre-wrap"
                : "text-zinc-700 prose prose-sm prose-p:my-1.5 prose-headings:text-zinc-900 prose-headings:font-semibold prose-headings:mt-4 prose-strong:text-zinc-900 prose-strong:font-semibold prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2 max-w-none"
            }`}>
              {msg.role === "user"
                ? msg.parts?.map((part, i) =>
                    part.type === "text" ? <span key={i}>{part.text}</span> : null
                  )
                : msg.parts?.map((part, i) =>
                    part.type === "text" ? <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown> : null
                  )
              }
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Chat input */}
      <div className="px-6 pb-6 pt-3">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 focus-within:bg-white focus-within:border-zinc-300 transition-all">
          <div className="flex items-center gap-2 px-4 py-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="Ask about topics, request a brief…"
              className="flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none"
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center flex-shrink-0 hover:bg-zinc-700 disabled:opacity-30 transition-all"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
