export type Tags = Record<string, string | undefined>;
export const crossingStyle = (tags: Tags) => {
  const style = tags['crossing:markings'] ?? (tags.crossing === 'marked' ? 'yes' : undefined);
  return style === 'zebra' || style === 'ladder' || style === 'lines'
    ? style
    : style === 'yes'
      ? 'lines'
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

/** Colour, buffering and physical protection are independent lane properties. */
export function bicycleAppearance(tags: Tags, side?: number, kind = 'track') {
  const key = side === -1 ? 'left' : 'right';
  const value = (property: string) =>
    side === undefined
      ? (tags[property] ?? tags[`cycleway:${property}`])
      : (tags[`cycleway:${key}:${property}`] ??
        tags[`cycleway:both:${property}`] ??
        tags[`cycleway:${property}`]);
  const colour = value('surface:colour');
  const separation = (value('separation') || '').split(';');
  const buffer = value('buffer');
  const physical = separation.some((s) =>
    [
      'bollard',
      'flex_post',
      'kerb',
      'bump',
      'planter',
      'vertical_panel',
      'greenery',
      'hedge',
      'tree_row',
      'parking_lane',
    ].includes(s),
  );
  return {
    green: colour === undefined ? null : colour === 'green' || colour.toLowerCase() === '#008000',
    buffered: !!buffer && buffer !== 'no' && buffer !== '0',
    protected:
      kind !== 'shared_lane' && (kind === 'track' || physical) && !separation.includes('no'),
    separator:
      separation.find((s) =>
        [
          'bollard',
          'flex_post',
          'kerb',
          'bump',
          'planter',
          'vertical_panel',
          'greenery',
          'hedge',
          'tree_row',
          'parking_lane',
        ].includes(s),
      ) ?? null,
  };
}

export function separateCyclewayAppearance(tags: Tags, side: number) {
  const key = side === -1 ? 'left' : 'right';
  return bicycleAppearance({
    ...tags,
    separation: tags[`separation:${key}`] ?? tags['separation:both'] ?? tags.separation,
    buffer: tags[`buffer:${key}`] ?? tags['buffer:both'] ?? tags.buffer,
  });
}
