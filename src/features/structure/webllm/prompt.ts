import { MUSCLE_GROUPS } from './schema'

/** System prompt: turn a freeform log into structured events. Kept terse — the
 *  JSON schema does the format enforcement, so this focuses on intent. */
export const SYSTEM_PROMPT = `You convert a person's freeform workout and meal notes into structured data.
Split the text into individual events. For each event:
- kind "workout": set "exercise" and, when present, "sets" (reps, weightKg, durationSec, distanceM) and "muscleGroups" from: ${MUSCLE_GROUPS.join(', ')}.
- kind "meal": set "description" and any macros you are confident about (calories, proteinG, carbsG, fatG).
- kind "note": anything that is neither, set "text".
Convert pounds to kg and miles/km to metres. Do not invent numbers. Respond only with JSON matching the schema.`

export function buildUserPrompt(rawText: string): string {
  return `Notes:\n${rawText}`
}
