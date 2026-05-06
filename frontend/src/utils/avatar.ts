/**
 * Pool of Tailwind background classes used for placeholder avatars + board
 * group dots. Picked to feel distinct at a glance without clashing with
 * priority/urgency semantics (red/amber are intentionally muted to rose/amber
 * to leave pure-red for "overdue" cues).
 */
export const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
];

/**
 * Deterministic colour pick for a user / board / tag id. Same id always maps
 * to the same colour so a user looks consistent across views, but no real
 * hashing — just first-char modulo. Don't rely on uniform distribution; if
 * two ids start with the same letter they collide.
 */
export function getAvatarColor(userId: string): string {
  return AVATAR_COLORS[userId.charCodeAt(0) % AVATAR_COLORS.length];
}
