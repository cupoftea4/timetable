export const themes = [
  {
    value: 'light' as const,
    name: 'Light',
    color1: '#f5f5f5',
    color2: '#ffffff'
  },
  {
    value: 'dark' as const,
    name: 'Dark',
    color1: '#1b1b1b',
    color2: '#2b2b2b'
  },
  {
    value: 'light-fall-guys' as const, // custom themes should start with light or dark
    name: 'Fall Guys',
    color1: 'green',
    color2: 'pink'
  },
  {
    value: 'dark-oleh' as const, // custom themes should start with light or dark
    name: 'New Dark Oleh',
    color1: '#00ADB5',
    color2: '#222831'
  }
];

export type ThemeType = typeof themes[number];
export type ThemeValue = typeof themes[number]['value'];
