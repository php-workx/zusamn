import { createFont, createTamagui } from "tamagui";

const systemFont = createFont({
  family: "System",
  size: {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 20,
    6: 24
  },
  lineHeight: {
    1: 16,
    2: 18,
    3: 22,
    4: 24,
    5: 28,
    6: 32
  },
  weight: {
    1: "400",
    2: "500",
    3: "600",
    4: "700"
  },
  letterSpacing: {
    1: 0,
    2: 0,
    3: -0.2,
    4: -0.4,
    5: -0.5,
    6: -0.6
  }
});

export const tamaguiConfig = createTamagui({
  defaultTheme: "light",
  shouldAddPrefersColorThemes: false,
  themeClassNameOnRoot: false,
  shorthands: {
    p: "padding",
    px: "paddingHorizontal",
    py: "paddingVertical",
    m: "margin",
    mx: "marginHorizontal",
    my: "marginVertical",
    bg: "backgroundColor",
    f: "flex"
  },
  tokens: {
    color: {
      white: "#ffffff",
      black: "#000000",
      gray1: "#f5f5f7",
      gray2: "#e5e5ea",
      gray3: "#d1d1d6",
      gray6: "#8e8e93",
      gray8: "#1c1c1e",
      blue: "#007aff",
      green: "#34c759",
      red: "#ff3b30"
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
      8: 40
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
      8: 40
    },
    radius: {
      0: 0,
      1: 6,
      2: 10,
      3: 14,
      4: 18
    },
    zIndex: {
      0: 0,
      1: 10,
      2: 20,
      3: 30,
      4: 40
    }
  },
  fonts: {
    body: systemFont,
    heading: systemFont
  },
  themes: {
    light: {
      background: "$white",
      color: "$black",
      borderColor: "$gray2",
      placeholderColor: "$gray6",
      accentBackground: "$blue",
      accentColor: "$white"
    },
    dark: {
      background: "$black",
      color: "$white",
      borderColor: "$gray8",
      placeholderColor: "$gray6",
      accentBackground: "$blue",
      accentColor: "$white"
    }
  }
});

export type TamaguiConfig = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends TamaguiConfig {}
}
