import { createFont, createTamagui } from 'tamagui';

const systemFont = createFont({
  family: 'System',
  size: {
    1: 13,
    2: 17,
    3: 20,
    4: 24,
  },
  lineHeight: {
    1: 18,
    2: 22,
    3: 28,
    4: 32,
  },
  weight: {
    1: '400',
    2: '600',
    3: '700',
  },
  letterSpacing: {
    1: 0,
    2: -0.2,
    3: -0.4,
    4: -0.6,
  },
});

export const tamaguiConfig = createTamagui({
  defaultTheme: 'light',
  shouldAddPrefersColorThemes: false,
  themeClassNameOnRoot: false,
  shorthands: {
    p: 'padding',
    px: 'paddingHorizontal',
    py: 'paddingVertical',
    m: 'margin',
    mx: 'marginHorizontal',
    my: 'marginVertical',
    bg: 'backgroundColor',
    f: 'flex',
  },
  tokens: {
    color: {
      white: '#ffffff',
      black: '#000000',
      gray1: '#f5f5f7',
      gray2: '#e5e5ea',
      gray3: '#d1d1d6',
      gray6: '#8e8e93',
      gray8: '#1c1c1e',
      blue: '#007aff',
      green: '#34c759',
      red: '#ff3b30',
    },
    size: {
      0: 0,
      1: 4,
      2: 8,
      3: 12,
      4: 16,
      5: 20,
      6: 24,
      7: 32,
      8: 40,
    },
    space: {
      0: 0,
      1: 4,
      2: 8,
      3: 12,
      4: 16,
      5: 20,
      6: 24,
      7: 32,
      8: 40,
    },
    radius: {
      0: 0,
      1: 12,
      2: 16,
    },
    zIndex: {
      0: 0,
      1: 10,
      2: 20,
      3: 30,
      4: 40,
    },
  },
  fonts: {
    body: systemFont,
    heading: systemFont,
  },
  themes: {
    light: {
      background: '$white',
      color: '$black',
      borderColor: '$gray2',
      placeholderColor: '$gray6',
      accentBackground: '$blue',
      accentColor: '$white',
      bg: '$white',
      surface: '$gray1',
      text: '$black',
      textMuted: '$gray6',
      separator: '$gray2',
      accent: '$blue',
      danger: '$red',
    },
    dark: {
      background: '$black',
      color: '$white',
      borderColor: '$gray8',
      placeholderColor: '$gray6',
      accentBackground: '$blue',
      accentColor: '$white',
      bg: '$black',
      surface: '$gray8',
      text: '$white',
      textMuted: '$gray6',
      separator: '$gray8',
      accent: '$blue',
      danger: '$red',
    },
  },
});

export type TamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends TamaguiConfig {}
}
