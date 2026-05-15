type Axis = "changelog" | "community" | "gap" | "competitors";
type Tier = "deployment" | "ai-native";

const axisColors: Record<Axis, string> = {
  changelog: "bg-blue-50 text-blue-600 border border-blue-100",
  community: "bg-violet-50 text-violet-600 border border-violet-100",
  gap: "bg-amber-50 text-amber-700 border border-amber-100",
  competitors: "bg-rose-50 text-rose-600 border border-rose-100",
};

interface AxisBadgeProps {
  axis: Axis;
  tier?: Tier;
}

export function AxisBadge({ axis, tier }: AxisBadgeProps) {
  return (
    <span className="flex items-center gap-1.5 flex-wrap">
      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full capitalize ${axisColors[axis]}`}>
        {axis}
      </span>
      {tier && (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200">
          {tier}
        </span>
      )}
    </span>
  );
}
