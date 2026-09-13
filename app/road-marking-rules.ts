export type Tags = Record<string, string | undefined>;
export const crossingStyle = (tags: Tags) => {
  const style = tags['crossing:markings'];
  return style === 'zebra' || style === 'ladder' || style === 'lines'
    ? style
    : style === 'yes'
      ? 'zebra'
      : null;
};
export function bicycleSides(tags: Tags) {
  const sides: { side: number; kind: string }[] = [];
  for (const [key, side] of [
    ['left', -1],
    ['right', 1],
  ] as const) {
    if (
      side === -1 &&
      tags.oneway === 'yes' &&
      !tags['cycleway:left'] &&
      !tags['cycleway:both'] &&
      !tags.cycleway?.startsWith('opposite_')
    )
      continue;
    const kind = tags[`cycleway:${key}`] ?? tags['cycleway:both'] ?? tags.cycleway;
    if (!kind || ['no', 'none', 'separate'].includes(kind)) continue;
    if (['lane', 'track', 'shared_lane'].includes(kind)) sides.push({ side, kind });
    else if (kind === 'opposite_lane' || kind === 'opposite_track') {
      if (side === -1) sides.push({ side, kind: kind.replace('opposite_', '') });
    }
  }
  return sides;
}
