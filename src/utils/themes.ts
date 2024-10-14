// custom theme values should start with light or dark
export const themes = [
  {
    value: 'light' as const,
    name: 'Light',
    color1: '#fff6f6',
    color2: '#e4e7f4'
  },
  {
    value: 'dark' as const,
    name: 'Dark',
    color1: '#101010',
    color2: '#070d21'
  },
  {
    value: 'dark-fall-guys' as const,
    name: 'Fall Guys',
    color1: '#fc5490',
    color2: '#fdff5b'
  },
  {
    value: 'dark-denys' as const,
    name: 'New Dark Denys',
    color1: '#00ADB5',
    color2: '#222831'
  },
  {
    value: 'light-satisfactory' as const,
    name: 'Satisfactory',
    color1: '#fa9549',
    color2: '#5f668c'
  }
];

export type ThemeType = typeof themes[number];
export type ThemeValue = typeof themes[number]['value'];
