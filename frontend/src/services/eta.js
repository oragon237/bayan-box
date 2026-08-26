/**
 * Provincial ETA buffer (FR-MAP-004).
 * Multiplies raw route duration by 1.30x to absorb provincial delays.
 * Returns a friendly range string.
 */

const MULTIPLIER = 1.3;
const SPREAD = 7; // minutes

/**
 * @param {number} durationSeconds — raw route duration from Mapbox/ORS
 * @returns {{ min: number, max: number, label: string }}
 */
export function calculateEta(durationSeconds) {
  const buffered = (durationSeconds * MULTIPLIER) / 60;
  const min = Math.max(1, Math.round(buffered - SPREAD / 2));
  const max = Math.round(buffered + SPREAD / 2);

  const label = min === max ? `${min} min` : `${min} to ${max} mins`;

  return { min, max, label };
}

export { calculateEta as etaFromDuration };