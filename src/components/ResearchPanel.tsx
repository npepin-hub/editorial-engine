"use client";
import { useState } from "react";
import type { RankedTopic } from "@/lib/types";
import { TopicCard } from "./TopicCard";
import { LoadingState, type AxisStatuses, type AxisEvent, type Axis, ALL_AXES } from "./LoadingState";

export interface ResearchMeta {
  axes: Axis[];
  focusArea: string;
  ranAt: number;
}

interface ResearchPanelProps {
  topics: RankedTopic[];
  loading: boolean;
  axisStatuses: AxisStatuses;
  axisEvents: Record<Axis, AxisEvent[]>;
  synthesizing: boolean;
  errors: string[];
  selectedAxes: Axis[];
  researchMeta: ResearchMeta | null;
  onSelectedAxesChange: (axes: Axis[]) => void;
  onRun: (focusArea: string) => void;
  onReset: () => void;
}

const axisDescriptions: Record<Axis, string> = {
  changelog: "Vercel releases worth explaining",
  community: "Reddit & HN developer pain points",
  gap: "Topics missing from Vercel's blog & docs",
  competitors: "Angles competitors covered that Vercel hasn't",
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function timeAgo(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

interface ControlsProps {
  focusArea: string;
  onFocusAreaChange: (v: string) => void;
  selectedAxes: Axis[];
  onToggleAxis: (axis: Axis) => void;
  onSelectAll: () => void;
  loading: boolean;
  onRun: () => void;
}

function Controls({ focusArea, onFocusAreaChange, selectedAxes, onToggleAxis, onSelectAll, loading, onRun }: ControlsProps) {
  const allSelected = selectedAxes.length === ALL_AXES.length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-semibold text-zinc-600 uppercase tracking-wider">Axes</span>
          <button
            onClick={onSelectAll}
            disabled={loading}
            className="text-[10px] font-mono text-zinc-400 hover:text-zinc-700 disabled:opacity-40 transition-colors"
          >
            {allSelected ? "Deselect all" : "Select all"}
          </button>
        </div>
        <div className="space-y-1.5">
          {ALL_AXES.map(axis => {
            const active = selectedAxes.includes(axis);
            return (
              <button
                key={axis}
                onClick={() => onToggleAxis(axis)}
                disabled={loading}
                className="w-full flex items-center gap-3 text-left disabled:opacity-40 group"
              >
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono flex-shrink-0 transition-all ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "bg-white border border-zinc-200 text-zinc-500 group-hover:border-zinc-400 group-hover:text-zinc-700"
                }`}>
                  {capitalize(axis)}
                </span>
                <span className={`text-[11px] transition-colors ${active ? "text-zinc-500" : "text-zinc-400"}`}>
                  {axisDescriptions[axis]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 focus-within:bg-white focus-within:border-zinc-300 px-4 py-3 transition-all flex items-center gap-3">
        <input
          type="text"
          value={focusArea}
          onChange={e => onFocusAreaChange(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !loading && onRun()}
          placeholder='Narrow the scope — e.g. "AI SDK", "edge functions"'
          className="flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none"
        />
        <span className="text-xs text-zinc-400 italic flex-shrink-0">Optional</span>
      </div>

      <button
        onClick={onRun}
        disabled={loading || selectedAxes.length === 0}
        className="w-full bg-zinc-900 text-white text-[11px] font-mono py-3 rounded-xl hover:bg-zinc-700 disabled:opacity-30 transition-all"
      >
        {loading
          ? "Running…"
          : selectedAxes.length < ALL_AXES.length
          ? `Run ${selectedAxes.length} of ${ALL_AXES.length} axes`
          : "Run Research"}
      </button>
    </div>
  );
}

function DiagramThumbnail() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="block w-full h-full text-left group relative"
        title="Click to expand"
      >
        <img
          src="/workflow.png"
          alt="Content Radar workflow"
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
            src="/workflow.png"
            alt="Content Radar workflow"
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

function EmptyState({ controls }: { controls: React.ReactNode }) {
  return (
    <div className="h-full flex flex-col gap-4 py-2">
      <div className="space-y-1.5 flex-shrink-0">
        <p className="text-base font-semibold text-zinc-900">What should Vercel publish next?</p>
        <p className="text-sm text-zinc-500 leading-relaxed">
          Scans four live signals — product releases, developer community, content gaps, and competitor blogs — in parallel and surfaces ranked blog opportunities in real time. Every run is fresh.
        </p>
      </div>

      <div className="space-y-2 flex-shrink-0">
        <span className="text-xs font-mono font-semibold text-zinc-600 uppercase tracking-wider">How it works</span>
        <ol className="space-y-1.5">
          {[
            "Select the axes you want to pull signals from.",
            'Narrow the scope with a focus area if needed — e.g. "AI SDK".',
            "Run research — axes fire in parallel, results are ranked automatically.",
            "Refine with the editorial agent on the right.",
          ].map((text, i) => (
            <li key={i} className="flex gap-4">
              <span className="text-[10px] font-mono text-zinc-400 mt-0.5 flex-shrink-0 w-4">{i + 1}</span>
              <span className="text-sm text-zinc-500 leading-relaxed">{text}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex-1 min-h-0">
        <span className="text-xs font-mono font-semibold text-zinc-600 uppercase tracking-wider block mb-2">Example workflow</span>
        <div className="h-[calc(100%-24px)]">
          <DiagramThumbnail />
        </div>
      </div>

      <div className="flex-shrink-0">{controls}</div>
    </div>
  );
}

export function ResearchPanel({
  topics, loading, axisStatuses, axisEvents, synthesizing,
  errors, selectedAxes, researchMeta, onSelectedAxesChange, onRun, onReset
}: ResearchPanelProps) {
  const [focusArea, setFocusArea] = useState("");
  const hasResults = topics.length > 0;

  const toggleAxis = (axis: Axis) => {
    if (selectedAxes.includes(axis)) {
      if (selectedAxes.length === 1) return;
      onSelectedAxesChange(selectedAxes.filter(a => a !== axis));
    } else {
      onSelectedAxesChange([...selectedAxes, axis]);
    }
  };

  const handleSelectAll = () => {
    onSelectedAxesChange(selectedAxes.length === ALL_AXES.length ? [ALL_AXES[0]] : [...ALL_AXES]);
  };

  const controlProps = {
    focusArea,
    onFocusAreaChange: setFocusArea,
    selectedAxes,
    onToggleAxis: toggleAxis,
    onSelectAll: handleSelectAll,
    loading,
    onRun: () => onRun(focusArea),
  };

  return (
    <div className="w-1/2 border-r border-zinc-100 flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-start justify-between">
        <div>
          <p className="text-xl font-mono font-bold text-zinc-900 uppercase tracking-widest mb-1">Research</p>
          <p className="text-sm text-zinc-500">Select axes, narrow scope, run — results ranked automatically.</p>
        </div>
        {hasResults && (
          <button
            onClick={onReset}
            className="text-[10px] font-mono text-zinc-400 hover:text-zinc-700 transition-colors flex-shrink-0 mt-0.5"
          >
            New research
          </button>
        )}
      </div>

      {/* Post-run summary */}
      {hasResults && researchMeta && (
        <div className="px-6 pb-4">
          <p className="text-xs text-zinc-400">
            Researched across{" "}
            <span className="text-zinc-600">
              {researchMeta.axes.map(capitalize).join(", ")}
            </span>
            {researchMeta.focusArea && (
              <> · focused on <span className="text-zinc-600">{researchMeta.focusArea}</span></>
            )}
            {" · "}{timeAgo(researchMeta.ranAt)}
          </p>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 min-h-0 px-6 pb-6 flex flex-col">
        {loading && (
          <div className="overflow-y-auto flex-1">
            <LoadingState axisStatuses={axisStatuses} axisEvents={axisEvents} synthesizing={synthesizing} activeAxes={selectedAxes} />
          </div>
        )}

        {errors.length > 0 && (
          <div className="space-y-1 mb-3">
            {errors.map(e => (
              <div key={e} className="text-xs font-mono text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {e}
              </div>
            ))}
          </div>
        )}

        {!loading && !hasResults && <EmptyState controls={<Controls {...controlProps} />} />}

        {!loading && hasResults && (
          <div className="overflow-y-auto flex-1 space-y-3">
            {topics.map(topic => (
              <TopicCard key={topic.title} topic={topic} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
