import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    primary: '#9e001f', // Medical Red
    primaryContainer: '#c8102e',
    onPrimary: '#ffffff',
    secondary: '#5b5f61',
    onSecondary: '#ffffff',
    tertiary: '#00583b', // Success Green
    onTertiary: '#ffffff',
    error: '#ba1a1a', // Emergency Crimson
    onError: '#ffffff',
    background: '#f8f9ff', // Soft Pearl Gray background
    onBackground: '#121c2a',
    surface: '#ffffff',
    onSurface: '#121c2a',
    surfaceVariant: '#eff4ff',
    onSurfaceVariant: '#5c403f',
    outline: '#906f6e',
    outlineVariant: '#e5bdbb',
    border: '#d9e3f6',
    
    // UI Helpers
    text: '#121c2a',
    textSecondary: '#5b5f61',
    backgroundElement: '#e6eeff',
    backgroundSelected: '#dee9fc',
  },
  dark: {
    primary: '#ffb3b1',
    primaryContainer: '#9e001f',
    onPrimary: '#68000b',
    secondary: '#c4c7ca',
    onSecondary: '#2e3133',
    tertiary: '#4edea3',
    onTertiary: '#003823',
    error: '#ffb4ab',
    onError: '#690005',
    background: '#121c2a',
    onBackground: '#eaf1ff',
    surface: '#1b2027',
    onSurface: '#eaf1ff',
    surfaceVariant: '#44474e',
    onSurfaceVariant: '#c4c7ca',
    outline: '#8d9199',
    outlineVariant: '#44474e',
    border: '#27313f',
    
    // UI Helpers
    text: '#ffffff',
    textSecondary: '#b0b4ba',
    backgroundElement: '#212225',
    backgroundSelected: '#2e3135',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    sansBold: 'System',
    mono: 'Courier',
  },
  android: {
    sans: 'sans-serif',
    sansBold: 'sans-serif-condensed',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    sansBold: 'var(--font-display)',
    mono: 'var(--font-mono)',
  },
  default: {
    sans: 'System',
    sansBold: 'System',
    mono: 'System',
  }
});

export const Typography = {
  headlineXL: {
    fontFamily: Fonts.sans,
    fontSize: 36,
    fontWeight: '700' as const,
    lineHeight: 44,
  },
  headlineLG: {
    fontFamily: Fonts.sans,
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  headlineMD: {
    fontFamily: Fonts.sans,
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  bodyLG: {
    fontFamily: Fonts.sans,
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 26,
  },
  bodyMD: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySM: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  labelMD: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  labelSM: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 15,
  },
} as const;

export const Spacing = {
  half: 4,
  one: 8,
  two: 12,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
} as const;

export const Border = {
  radiusSm: 4,
  radiusDefault: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 24,
  radiusFull: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
