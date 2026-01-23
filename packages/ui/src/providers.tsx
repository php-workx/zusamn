import type { ReactNode } from "react";
import { TamaguiProvider, Theme } from "tamagui";
import { tamaguiConfig } from "./tamagui.config";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <TamaguiProvider config={tamaguiConfig}>
      <Theme name="light">{children}</Theme>
    </TamaguiProvider>
  );
}
