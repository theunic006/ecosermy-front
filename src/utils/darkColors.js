/**
 * Premium Dark Mode Color Palette
 * Centralized color helper for all pages that use inline styles.
 * Usage: const dc = useDarkColors();
 *        style={{ background: dc.tableHeaderBg }}
 */
import { useTheme } from '../hooks/useTheme';

export const DARK_COLORS = {
  // ── Table ──
  tableHeaderBg: '#0d1425',
  tableHeaderColor: '#c4ccdb',
  tableHeaderBorder: 'rgba(99,118,163,.1)',
  tableRowEven: 'rgba(255,255,255,.015)',
  tableRowOdd: 'transparent',
  tableRowHover: 'rgba(99,102,241,.06)',
  tableBorder: 'rgba(99,118,163,.05)',
  tableFooterBg: '#080d19',
  // ── Surfaces ──
  surfacePrimary: '#080d19',
  surfaceCard: 'rgba(15,22,41,.65)',
  surfaceElevated: '#161d33',
  surfaceSubtle: 'rgba(99,118,163,.04)',
  // ── Text ──
  textPrimary: '#e6eaf3',
  textSecondary: '#8892a6',
  textMuted: '#555f73',
  textInverse: '#080d19',
  // ── Accents ──
  accent: '#818cf8',
  accentGlow: 'rgba(99,102,241,.15)',
  accentSubtle: 'rgba(99,102,241,.08)',
  // ── Status ──
  success: '#34d399',
  successBg: 'rgba(52,211,153,.1)',
  successText: '#6ee7b7',
  warning: '#fbbf24',
  warningBg: 'rgba(251,191,36,.1)',
  warningText: '#fde68a',
  danger: '#f87171',
  dangerBg: 'rgba(248,113,113,.1)',
  dangerText: '#fca5a5',
  info: '#38bdf8',
  infoBg: 'rgba(56,189,248,.1)',
  infoText: '#7dd3fc',
  // ── Borders ──
  borderSubtle: 'rgba(99,118,163,.06)',
  borderNormal: 'rgba(99,118,163,.1)',
  borderFocus: 'rgba(99,102,241,.3)',
};

export const LIGHT_COLORS = {
  // ── Table ──
  tableHeaderBg: '#1e293b',
  tableHeaderColor: '#fff',
  tableHeaderBorder: '#334155',
  tableRowEven: '#fff',
  tableRowOdd: '#f8fafc',
  tableRowHover: '#eff6ff',
  tableBorder: '#e2e8f0',
  tableFooterBg: '#f8fafc',
  // ── Surfaces ──
  surfacePrimary: '#f8fafc',
  surfaceCard: '#ffffff',
  surfaceElevated: '#f1f5f9',
  surfaceSubtle: '#f8fafc',
  // ── Text ──
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textInverse: '#fff',
  // ── Accents ──
  accent: '#3b82f6',
  accentGlow: 'rgba(59,130,246,.12)',
  accentSubtle: '#dbeafe',
  // ── Status ──
  success: '#10b981',
  successBg: '#d1fae5',
  successText: '#059669',
  warning: '#f59e0b',
  warningBg: '#fef3c7',
  warningText: '#92400e',
  danger: '#ef4444',
  dangerBg: '#fee2e2',
  dangerText: '#dc2626',
  info: '#06b6d4',
  infoBg: '#cffafe',
  infoText: '#0891b2',
  // ── Borders ──
  borderSubtle: '#f1f5f9',
  borderNormal: '#e2e8f0',
  borderFocus: 'rgba(59,130,246,.3)',
};

/**
 * Hook that returns the current color palette based on theme.
 */
export function useDarkColors() {
  const { theme } = useTheme();
  return theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
}

/**
 * Returns isDark flag + color palette.
 */
export function useThemeColors() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = isDark ? DARK_COLORS : LIGHT_COLORS;
  return { isDark, c };
}
