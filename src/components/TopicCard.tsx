import type { RankedTopic } from "@/lib/types";
import { AxisBadge } from "./AxisBadge";

interface TopicCardProps {
  topic: RankedTopic;
}

function isFullUrl(url: string) {
  try {
    return new URL(url).pathname.length > 1;
  } catch { return false; }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs font-mono font-semibold text-zinc-600 uppercase tracking-wider w-20 flex-shrink-0 pt-px">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

export function TopicCard({ topic }: TopicCardProps) {
  const fullSources = (topic.sources ?? []).filter(isFullUrl);

  return (
    <div className="border border-zinc-200 rounded-lg p-4 space-y-3 bg-white hover:border-zinc-300 transition-colors">
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] font-mono text-zinc-400 flex-shrink-0">#{topic.rank}</span>
        <h3 className="text-sm font-semibold text-zinc-900 leading-snug">{topic.title}</h3>
        {topic.sustainedSignal && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100 flex-shrink-0">
            sustained
          </span>
        )}
      </div>

      <p className="text-xs text-zinc-500 leading-relaxed">{topic.rationale}</p>

      <div className="space-y-2 pt-1">
        <MetaRow label="Axis">
          <div className="flex items-center gap-2 flex-wrap">
            <AxisBadge axis={topic.axis} tier={topic.axis === "competitors" ? topic.competitorTier : undefined} />
          </div>
        </MetaRow>

        <MetaRow label="Audience">
          <p className="text-[11px] text-zinc-500 leading-relaxed">{topic.audience}</p>
        </MetaRow>

        <MetaRow label="Format">
          <span className="text-[11px] text-zinc-500">{capitalize(topic.contentType)}</span>
        </MetaRow>

        {fullSources.length > 0 && (
          <MetaRow label="Sources">
            <div className="flex flex-col gap-1">
              {fullSources.map(url => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-zinc-400 hover:text-zinc-700 underline underline-offset-2 transition-colors break-all"
                >
                  {url}
                </a>
              ))}
            </div>
          </MetaRow>
        )}
      </div>
    </div>
  );
}
