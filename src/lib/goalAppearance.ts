import AsyncStorage from '@react-native-async-storage/async-storage';

export const goalColors = [
  { name: 'Forest', light: '#DCECE1', dark: '#243F32', ink: '#264E3A' },
  { name: 'Peach', light: '#F8E2D3', dark: '#4A332B', ink: '#945838' },
  { name: 'Lilac', light: '#EAE2F5', dark: '#3B304C', ink: '#765A94' },
  { name: 'Honey', light: '#F5ECCB', dark: '#433C25', ink: '#84702D' },
  { name: 'Rose', light: '#F5DFE5', dark: '#482F3A', ink: '#96556D' },
  { name: 'Ocean', light: '#DCECEF', dark: '#253D45', ink: '#376B7B' },
] as const;
export const goalEmoji = [
  '🌱',
  '✨',
  '🏃',
  '🌎',
  '🎨',
  '📚',
  '🏡',
  '🚀',
  '🎸',
  '🧘',
  '💛',
  '⛰️',
  '🐻',
  '🌊',
  '🍃',
  '🎯',
  '🦋',
  '☀️',
];
export type GoalAppearance = { color: number; emoji: string | null };
export type GoalAppearances = Record<string, GoalAppearance>;
export const goalAppearanceKey = (owner: string) =>
  `@offtasks/goal-appearance:v1:${owner}`;
export const goalId = (name: string) => name.trim().toLocaleLowerCase();
export function defaultGoalAppearance(name: string): GoalAppearance {
  const hash = Array.from(name).reduce(
    (value, char) => (value * 31 + char.codePointAt(0)!) >>> 0,
    0,
  );
  return { color: hash % goalColors.length, emoji: null };
}
export function surpriseGoalAppearance(
  previous: GoalAppearance,
): GoalAppearance {
  return {
    color:
      (previous.color +
        1 +
        Math.floor(Math.random() * (goalColors.length - 1))) %
      goalColors.length,
    emoji: goalEmoji[Math.floor(Math.random() * goalEmoji.length)],
  };
}
const listeners = new Set<() => void>();
const queues = new Map<string, Promise<unknown>>();
export const subscribeGoalAppearance = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export async function readGoalAppearances(
  owner: string,
): Promise<GoalAppearances> {
  const raw = await AsyncStorage.getItem(goalAppearanceKey(owner));
  if (raw === null) return {};
  const data = JSON.parse(raw);
  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    !Object.values(data).every(
      (value: any) =>
        value &&
        Number.isInteger(value.color) &&
        value.color >= 0 &&
        value.color < goalColors.length &&
        (value.emoji === null || goalEmoji.includes(value.emoji)),
    )
  ) {
    throw new Error(
      'Goal appearance could not be read. Your saved choices were not changed.',
    );
  }
  return data;
}
export function writeGoalAppearance(
  owner: string,
  name: string,
  appearance: GoalAppearance | null,
) {
  const key = goalAppearanceKey(owner);
  const operation = (queues.get(key) ?? Promise.resolve())
    .catch(() => undefined)
    .then(async () => {
      const data = await readGoalAppearances(owner);
      const next = Object.create(null) as GoalAppearances;
      Object.keys(data).forEach(id => {
        next[id] = data[id];
      });
      if (appearance) next[goalId(name)] = appearance;
      else delete next[goalId(name)];
      await AsyncStorage.setItem(key, JSON.stringify(next));
      listeners.forEach(listener => listener());
    });
  queues.set(key, operation);
  void operation
    .finally(() => {
      if (queues.get(key) === operation) queues.delete(key);
    })
    .catch(() => undefined);
  return operation;
}

export async function clearGoalAppearances(owner: string) {
  await queues.get(goalAppearanceKey(owner))?.catch(() => undefined);
  await AsyncStorage.removeItem(goalAppearanceKey(owner));
  listeners.forEach(listener => listener());
}
