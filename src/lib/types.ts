import { z } from "zod";

export const TopicSignalSchema = z.object({
  title: z.string(),
  rationale: z.string(),
  axis: z.enum(["changelog", "community", "gap", "competitors"]),
  competitorTier: z.enum(["deployment", "ai-native"]).optional(),
  audience: z.string(),
  contentType: z.enum(["blog post", "tutorial", "thought leadership", "case study"]),
  sources: z.array(z.string().url()).min(1)
});

export const AxisOutputSchema = z.array(TopicSignalSchema);

export const RankedTopicSchema = TopicSignalSchema.extend({
  rank: z.number(),
  sustainedSignal: z.boolean()
});

export const SynthesisOutputSchema = z.array(RankedTopicSchema).max(7);

export const BriefSchema = z.object({
  angle: z.string(),
  hook: z.string(),
  audience: z.string(),
  narrativeArc: z.array(z.string()).length(4),
  technicalDetails: z.array(z.string()),
  whyNow: z.string(),
  titleOptions: z.array(z.string()).length(3)
});

export type TopicSignal = z.infer<typeof TopicSignalSchema>;
export type RankedTopic = z.infer<typeof RankedTopicSchema>;
export type Brief = z.infer<typeof BriefSchema>;
