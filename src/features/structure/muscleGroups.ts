import type { MuscleGroup } from '@/db/types'

/**
 * Maps exercise wording to the muscle groups it trains. Ordered, first-match-wins
 * per keyword; an exercise can hit several groups. Keep entries lowercase. This
 * table is what makes the step 4 muscle-group leaderboard possible.
 */
interface MuscleRule {
  keywords: string[]
  groups: MuscleGroup[]
}

const RULES: MuscleRule[] = [
  // Cardio
  {
    keywords: [
      'run',
      'jog',
      'sprint',
      'bike',
      'cycl',
      'spin',
      'swim',
      'row erg',
      'rowing machine',
      'elliptical',
      'walk',
      'hike',
      'cardio',
      'treadmill',
    ],
    groups: ['cardio'],
  },
  // Compound / multi-group
  { keywords: ['deadlift'], groups: ['back', 'glutes', 'legs'] },
  { keywords: ['clean', 'snatch', 'thruster'], groups: ['legs', 'shoulders', 'back'] },
  // Chest
  {
    keywords: ['bench', 'chest press', 'chest fly', 'pec', 'push up', 'pushup', 'press up', 'dip'],
    groups: ['chest', 'triceps'],
  },
  // Back
  {
    keywords: ['pull up', 'pullup', 'chin up', 'chinup', 'lat pulldown', 'pulldown', 'row', 'rows'],
    groups: ['back', 'biceps'],
  },
  // Shoulders
  {
    keywords: [
      'overhead press',
      'ohp',
      'shoulder press',
      'military press',
      'lateral raise',
      'front raise',
      'rear delt',
      'delt',
      'shrug',
      'arnold',
    ],
    groups: ['shoulders'],
  },
  // Arms
  { keywords: ['curl', 'bicep'], groups: ['biceps'] },
  {
    keywords: ['tricep', 'pushdown', 'skullcrusher', 'kickback', 'close grip'],
    groups: ['triceps'],
  },
  // Legs / glutes
  {
    keywords: [
      'squat',
      'leg press',
      'lunge',
      'leg extension',
      'leg curl',
      'calf',
      'split squat',
      'step up',
    ],
    groups: ['legs'],
  },
  { keywords: ['hip thrust', 'glute', 'bridge', 'romanian', 'rdl'], groups: ['glutes', 'legs'] },
  // Core
  {
    keywords: [
      'plank',
      'crunch',
      'sit up',
      'situp',
      'ab ',
      'abs',
      'leg raise',
      'russian twist',
      'hollow',
    ],
    groups: ['core'],
  },
]

/**
 * Muscle groups trained by an exercise phrase. Returns a de-duplicated list, or
 * an empty array if nothing matched (caller decides whether to keep it).
 */
export function muscleGroupsFor(exercise: string): MuscleGroup[] {
  const text = ` ${exercise.toLowerCase()} `
  const found = new Set<MuscleGroup>()
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      for (const g of rule.groups) found.add(g)
    }
  }
  return [...found]
}

/** Whether the phrase looks like a cardio activity (no weights/sets expected). */
export function isCardio(exercise: string): boolean {
  return muscleGroupsFor(exercise).includes('cardio')
}
