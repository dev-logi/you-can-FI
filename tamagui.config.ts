import { createTamagui, createTokens } from 'tamagui';
import { createInterFont } from '@tamagui/font-inter';
import { shorthands } from '@tamagui/shorthands';
import { themes as baseThemes, tokens as baseTokens } from '@tamagui/config/v3';
import { createMedia } from '@tamagui/react-native-media-driver';
import { createAnimations } from '@tamagui/animations-react-native';

// Custom color palette for "calm, trustworthy" finance app
const customColors = {
  // Primary - Deep Navy (trust, stability)
  primary: '#1e3a5f',
  primaryLight: '#2d5a8a',
  primaryDark: '#0f1f33',
  
  // Accent - Warm Gold (optimism, progress)
  accent: '#d4a84b',
  accentLight: '#e8c97a',
  accentDark: '#b8922f',
  
  // Background - Soft Cream (calm, approachable)
  background: '#faf8f5',
  backgroundDark: '#1a1a1a',
  
  // Surface colors
  surface: '#ffffff',
  surfaceDark: '#2d2d2d',
  
  // Success - Muted Green (growth)
  success: '#4a7c59',
  successLight: '#6b9e7a',
  
  // Warning
  warning: '#d4a84b',
  
  // Error / Liabilities
  error: '#c75c5c',
  errorLight: '#e88888',
  
  // Text
  textPrimary: '#2d3436',
  textSecondary: '#636e72',
  textMuted: '#a0a0a0',
  textLight: '#ffffff',
  
  // Borders
  border: '#e0ddd8',
  borderDark: '#404040',
};

const animations = createAnimations({
  fast: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
  medium: {
    type: 'spring',
    damping: 15,
    mass: 1,
    stiffness: 150,
  },
  slow: {
    type: 'spring',
    damping: 20,
    stiffness: 60,
  },
  bouncy: {
    type: 'spring',
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
});

const headingFont = createInterFont({
  size: {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 40,
    10: 48,
    11: 56,
    12: 64,
  },
  weight: {
    1: '400',
    2: '500',
    3: '600',
    4: '700',
    5: '800',
  },
  letterSpacing: {
    4: 0,
    5: -0.5,
    6: -0.5,
    7: -1,
  },
});

const bodyFont = createInterFont({
  size: {
    1: 12,
    2: 14,
    3: 15,
    4: 16,
    5: 18,
    6: 20,
  },
  weight: {
    1: '400',
    2: '500',
    3: '600',
  },
});

const tokens = createTokens({
  ...baseTokens,
  color: {
    ...baseTokens.color,
    ...customColors,
  },
});

const lightTheme = {
  background: customColors.background,
  backgroundHover: '#f5f3f0',
  backgroundPress: '#eae8e5',
  backgroundFocus: '#f5f3f0',
  backgroundStrong: customColors.surface,
  backgroundTransparent: 'rgba(250, 248, 245, 0)',
  
  color: customColors.textPrimary,
  colorHover: customColors.textPrimary,
  colorPress: customColors.textSecondary,
  colorFocus: customColors.textPrimary,
  colorTransparent: 'rgba(45, 52, 54, 0)',
  
  borderColor: customColors.border,
  borderColorHover: customColors.primaryLight,
  borderColorFocus: customColors.primary,
  borderColorPress: customColors.primary,
  
  placeholderColor: customColors.textMuted,
  
  // Semantic colors
  blue1: customColors.primaryDark,
  blue2: customColors.primary,
  blue3: customColors.primaryLight,
  
  green1: customColors.success,
  green2: customColors.successLight,
  
  red1: customColors.error,
  red2: customColors.errorLight,
  
  yellow1: customColors.accent,
  yellow2: customColors.accentLight,
};

const darkTheme = {
  background: customColors.backgroundDark,
  backgroundHover: '#252525',
  backgroundPress: '#202020',
  backgroundFocus: '#252525',
  backgroundStrong: customColors.surfaceDark,
  backgroundTransparent: 'rgba(26, 26, 26, 0)',
  
  color: customColors.textLight,
  colorHover: customColors.textLight,
  colorPress: '#d0d0d0',
  colorFocus: customColors.textLight,
  colorTransparent: 'rgba(255, 255, 255, 0)',
  
  borderColor: customColors.borderDark,
  borderColorHover: customColors.primaryLight,
  borderColorFocus: customColors.primary,
  borderColorPress: customColors.primary,
  
  placeholderColor: '#808080',
  
  // Semantic colors
  blue1: customColors.primaryLight,
  blue2: customColors.primary,
  blue3: customColors.primaryDark,
  
  green1: customColors.successLight,
  green2: customColors.success,
  
  red1: customColors.errorLight,
  red2: customColors.error,
  
  yellow1: customColors.accentLight,
  yellow2: customColors.accent,
};

export const config = createTamagui({
  animations,
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  tokens,
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  media: createMedia({
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
    gtXs: { minWidth: 660 + 1 },
    gtSm: { minWidth: 800 + 1 },
    gtMd: { minWidth: 1020 + 1 },
    gtLg: { minWidth: 1280 + 1 },
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  }),
});

// Export custom colors for use in components
export const appColors = customColors;

export type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;

