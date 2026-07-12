/**
 * Single source of truth for routes that require authentication.
 *
 * Public routes (Home, Stats + sub-routes, modal) are intentionally omitted.
 * Used by:
 *   - RootLayoutNav to decide when to open the LoginPrompt modal.
 *   - Defense-in-depth checks inside individual protected screens.
 */

// Route segments (NOT including group wrappers like "(tabs)") that mark a route as protected.
// We match by segment to avoid the group-name parsing ambiguity in useSegments().
const PROTECTED_SEGMENTS = new Set<string>([
  'profile',
  'portfolio',     // matches /(tabs)/portfolio/*
  // 'strategy' removed: feature temporarily disabled pending bug fix.
  'ai-assistant',  // matches /ai-assistant/*
  // 'lottery' is intentionally NOT here — Home shows latest XSMB result, and
  // /(tabs)/lottery/detail + /(tabs)/lottery/lookup are public for guests.
]);

/**
 * Returns true if the given pathname should be guarded behind authentication.
 *
 * Accepts either:
 *   - a full pathname like "/portfolio/history"
 *   - a segments array (e.g. from useSegments()): ['(tabs)', 'portfolio']
 *
 * Strips query string and hash before matching.
 */
export function isProtectedRoute(
  input: string | string[] | undefined | null,
): boolean {
  if (!input) return false;

  const segments: string[] = Array.isArray(input)
    ? input
    : input
        .split('?')[0]
        .split('#')[0]
        .split('/')
        .filter(Boolean);

  // Skip group wrappers like "(tabs)" / "(auth)" so segment names match exactly.
  return segments.some((s) => PROTECTED_SEGMENTS.has(s));
}