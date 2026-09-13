export const noteTones = [
  {
    id: 'paper',
    name: 'Paper',
    light: '#FAFCFB',
    dark: '#19221F',
    accent: '#84968C',
  },
  {
    id: 'sage',
    name: 'Sage',
    light: '#EEF5EF',
    dark: '#1C2C23',
    accent: '#76957E',
  },
  {
    id: 'sand',
    name: 'Sand',
    light: '#F9F4E9',
    dark: '#302A1F',
    accent: '#AF9969',
  },
  {
    id: 'rose',
    name: 'Rose',
    light: '#F9EFF1',
    dark: '#302329',
    accent: '#B78B98',
  },
  {
    id: 'lilac',
    name: 'Lilac',
    light: '#F3F0F8',
    dark: '#282333',
    accent: '#9C8AAF',
  },
  {
    id: 'mist',
    name: 'Mist',
    light: '#EEF4F6',
    dark: '#1F2A30',
    accent: '#7D9AA6',
  },
] as const;
export type NoteTone = (typeof noteTones)[number]['id'];
export const getNoteTone = (id?: string) =>
  noteTones.find(tone => tone.id === id) ?? noteTones[0];
