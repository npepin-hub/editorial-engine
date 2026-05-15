"use client";
import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ResearchPanel, type ResearchMeta } from "@/components/ResearchPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { ALL_AXES, type Axis, type AxisStatuses, type AxisEvent } from "@/components/LoadingState";
import type { RankedTopic } from "@/lib/types";

const IDLE_STATUSES: AxisStatuses = {
  changelog: "idle", community: "idle", gap: "idle", competitors: "idle"
};

const EMPTY_EVENTS: Record<Axis, AxisEvent[]> = {
  changelog: [], community: [], gap: [], competitors: []
};

export default function Home() {
  const [topics, setTopics] = useState<RankedTopic[]>([]);
  const [initialTopics, setInitialTopics] = useState<RankedTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const [axisStatuses, setAxisStatuses] = useState<AxisStatuses>(IDLE_STATUSES);
  const [axisEvents, setAxisEvents] = useState<Record<Axis, AxisEvent[]>>(EMPTY_EVENTS);
  const [errors, setErrors] = useState<string[]>([]);
  const [selectedAxes, setSelectedAxes] = useState<Axis[]>([...ALL_AXES]);
  const [researchMeta, setResearchMeta] = useState<ResearchMeta | null>(null);

  const { messages, setMessages, sendMessage } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat", body: { topics } })
  });

  const formatTopicsForChat = (t: RankedTopic[]) =>
    t.map((topic, i) =>
      `${i + 1}. **${topic.title}**\n   ${topic.rationale}\n   Source: ${topic.axis}${topic.competitorTier ? ` (${topic.competitorTier})` : ""} | ${topic.contentType}`
    ).join("\n\n");

  const resetResearch = () => {
    setTopics([]);
    setInitialTopics([]);
    setAxisStatuses(IDLE_STATUSES);
    setAxisEvents(EMPTY_EVENTS);
    setErrors([]);
    setResearchMeta(null);
    setMessages([]);
  };

  const runResearch = async (focusArea: string) => {
    setLoading(true);
    setSynthesizing(false);
    setErrors([]);
    setAxisEvents(EMPTY_EVENTS);
    setAxisStatuses(ALL_AXES.reduce((acc, axis) => ({
      ...acc,
      [axis]: selectedAxes.includes(axis) ? "running" : "idle",
    }), {} as AxisStatuses));

    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify({ focusArea });

    const fetchAxis = async (axis: Axis): Promise<unknown[] | null> => {
      try {
        const res = await fetch(`/api/axis/${axis}`, { method: "POST", body, headers });
        if (!res.ok) {
          const msg = (await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`;
          setErrors(prev => [...prev, `${axis}: ${msg}`]);
          setAxisStatuses(prev => ({ ...prev, [axis]: "error" }));
          return null;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let topics: unknown[] | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6)) as AxisEvent;
              if (event.type === "done") {
                topics = event.topics as unknown[];
                setAxisStatuses(prev => ({ ...prev, [axis]: "done" }));
              } else if (event.type === "error") {
                setErrors(prev => [...prev, `${axis}: ${event.message}`]);
                setAxisStatuses(prev => ({ ...prev, [axis]: "error" }));
              } else {
                setAxisEvents(prev => ({ ...prev, [axis]: [...prev[axis], event] }));
              }
            } catch { /* malformed line */ }
          }
        }
        return topics;
      } catch {
        setErrors(prev => [...prev, `${axis}: network error`]);
        setAxisStatuses(prev => ({ ...prev, [axis]: "error" }));
        return null;
      }
    };

    const results = await Promise.all(selectedAxes.map(fetchAxis));
    const axisOutputs = results.filter(r => r !== null);

    if (axisOutputs.length === 0) { setLoading(false); return; }

    setSynthesizing(true);
    try {
      const synthRes = await fetch("/api/synthesize", {
        method: "POST", body: JSON.stringify({ axisOutputs }), headers
      });
      if (!synthRes.ok) {
        const data = await synthRes.json().catch(() => ({}));
        setErrors(prev => [...prev, `synthesize: ${data?.error ?? `HTTP ${synthRes.status}`}`]);
      } else {
        const { topics: ranked } = await synthRes.json();
        setTopics(ranked);
        setInitialTopics(ranked);
        setResearchMeta({ axes: selectedAxes, focusArea: focusArea || "", ranAt: Date.now() });
        setMessages([{
          id: "initial", role: "assistant",
          parts: [{ type: "text", text: `Here are ${ranked.length} content opportunities based on current signals. Let me know if you'd like to refine, swap, or dig deeper into any of them.\n\n${formatTopicsForChat(ranked)}` }]
        }]);
      }
    } catch {
      setErrors(prev => [...prev, "synthesize: network error"]);
    }

    setLoading(false);
    setSynthesizing(false);
  };

  const resetChat = () => {
    setMessages([{
      id: "initial", role: "assistant",
      parts: [{ type: "text", text: `Here are ${initialTopics.length} content opportunities.\n\n${formatTopicsForChat(initialTopics)}` }]
    }]);
  };

  return (
    <main className="min-h-screen bg-white text-zinc-900 flex">
      <ResearchPanel
        topics={topics}
        loading={loading}
        axisStatuses={axisStatuses}
        axisEvents={axisEvents}
        synthesizing={synthesizing}
        errors={errors}
        selectedAxes={selectedAxes}
        researchMeta={researchMeta}
        onSelectedAxesChange={setSelectedAxes}
        onRun={runResearch}
        onReset={resetResearch}
      />
      <ChatPanel messages={messages} onSend={msg => sendMessage({ role: "user", parts: [{ type: "text", text: msg }] })} onResetChat={resetChat} />
    </main>
  );
}
