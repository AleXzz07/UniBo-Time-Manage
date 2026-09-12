// Design tokens for UniBo Planner — light + dark, monochromatic base with a
// harmonious per-subject color palette. Values come from design_guidelines.json.
//
// Use pairs: a background key + its `on` partner for text/icons on top.
// Build stylesheets with makeStyles(); read useTheme().colors for color props.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  surface: "#FFFFFF",
  onSurface: "#111111",
  surfaceSecondary: "#F7F7F7",
  onSurfaceSecondary: "#111111",
  surfaceTertiary: "#EBEBEB",
  onSurfaceTertiary: "#111111",
  surfaceInverse: "#111111",
  onSurfaceInverse: "#FFFFFF",
  muted: "#888888",

  brand: "#111111",
  onBrand: "#FFFFFF",
  brandPrimary: "#111111",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#333333",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#EBEBEB",
  onBrandTertiary: "#111111",

  success: "#527E65",
  onSuccess: "#FFFFFF",
  warning: "#DDA15E",
  onWarning: "#111111",
  error: "#D95D39",
  onError: "#FFFFFF",
  info: "#527E65",
  onInfo: "#FFFFFF",

  border: "#EAEBEA",
  borderStrong: "#CCCCCC",
  divider: "#F2F2F2",

  // Per-subject palette (consistent across calendar + study)
  subjectPhysics: "#E07A5F",
  subjectCalculus: "#81B29A",
  subjectThermo: "#F2CC8F",
  subjectCAD: "#BDB5B1",
  subjectMechanics: "#F4A261",
};

const dark: typeof light = {
  surface: "#0A0A0A",
  onSurface: "#F7F7F7",
  surfaceSecondary: "#141414",
  onSurfaceSecondary: "#F7F7F7",
  surfaceTertiary: "#222222",
  onSurfaceTertiary: "#F7F7F7",
  surfaceInverse: "#FFFFFF",
  onSurfaceInverse: "#111111",
  muted: "#777777",

  brand: "#FFFFFF",
  onBrand: "#111111",
  brandPrimary: "#FFFFFF",
  onBrandPrimary: "#111111",
  brandSecondary: "#EBEBEB",
  onBrandSecondary: "#111111",
  brandTertiary: "#222222",
  onBrandTertiary: "#FFFFFF",

  success: "#81B29A",
  onSuccess: "#111111",
  warning: "#F2CC8F",
  onWarning: "#111111",
  error: "#E07A5F",
  onError: "#111111",
  info: "#81B29A",
  onInfo: "#111111",

  border: "#222222",
  borderStrong: "#444444",
  divider: "#1A1A1A",

  subjectPhysics: "#C96248",
  subjectCalculus: "#5F8F78",
  subjectThermo: "#DDA15E",
  subjectCAD: "#8A837F",
  subjectMechanics: "#D97D45",
};

export type ThemeColors = typeof light;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 6, md: 12, lg: 16, pill: 999 } as const;

export const defaultScheme = "light" satisfies ColorScheme;
export const themes: { light: ThemeColors; dark?: ThemeColors } = { light, dark };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme);
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<
  T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>,
>(factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}

export function subjectColor(token: string | undefined | null, colors: ThemeColors): string {
  const key = (token || "subjectCAD") as keyof ThemeColors;
  const c = colors[key];
  return typeof c === "string" ? c : colors.muted;
}
