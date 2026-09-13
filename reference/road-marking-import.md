# Systematic road markings

Citywide OSM highway export timestamp: 2026-09-13T18:12:05Z. The retained
`public/streets.json` `roadMarkings` field contains 13,367 crossing ways,
5,578 roads carrying bicycle infrastructure tags, and 581 separate cycleways.
These are source features, not counts of complete intersections or bike lanes.
`scripts/import-road-markings.py` refreshes the data and the bounded source
files used by `scripts/build-road-markings.py` and the game renderer.

The current course subset has 180 crossing ways (131 with supported explicit
markings), 119 bicycle-tagged road ways and 18 separately mapped cycleways.
Unknown or explicitly absent crossing markings are not painted. Unspecified
marked crossings use a generic pair of white lines; zebra and ladder patterns
require their corresponding source tags.

Cycle lane type, green surface, buffer and physical protection are independent:

- Shared lanes: bicycle symbols and chevrons, no dedicated lane strip.
- Painted lanes: white boundary and bicycle symbols.
- Buffered lanes: additional boundary and diagonal buffer markings.
- Protected tracks: buffer and physical separator. Explicit separation tags
  select posts, low curbs, or planter-like separators. Unspecified protected
  track separation uses a generic modeled low curb, not an assertion about
  the actual separator material. Parking-lane protection does not generate posts.
- Separate cycleway geometry takes priority over inferred road-side offsets;
  left/right physical separation tags are respected.

Green paint follows explicit surface-colour tags when supplied. The course
subset has no explicit green-colour tags on its road-side lane features;
the earlier retained Street View observations still provide its green-paint
fallback. An explicit other colour overrides that fallback. The existing King
Street patch-only treatment is retained unless a source explicitly says green.

Dimensions, road-side offsets, separator spacing and generic curb material are
modeled estimates. OSM coverage is incomplete, and unmapped crossings and
unrecorded coloured-pavement patches still require an imagery or field survey.
Paint and physical separators stop around mapped crossings and junctions.

Tag references:
- https://wiki.openstreetmap.org/wiki/Key:crossing:markings
- https://wiki.openstreetmap.org/wiki/Key:cycleway:surface:colour
- https://wiki.openstreetmap.org/wiki/Key:cycleway:buffer
- https://wiki.openstreetmap.org/wiki/Key:cycleway:separation
