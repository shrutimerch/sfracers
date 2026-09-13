# South Park visual survey

Ten Google Street View screenshots were inspected in the browser on September 12, 2026. All showed January 2025 imagery. The JSON records requested viewpoints, visible location labels and observations. Street View labels are approximate camera locations, not proof of a building address. Facade profiles use legible addresses plus OSM footprint addresses where available. Views obscured by trees and cars do not verify hidden details.

Changes: address-specific palette and window styles; estimated storey heights; industrial window grids and arches; siding and brick coursing; entrance paving; taller winter tree silhouettes. Exact pole, tree species, dimensions and hidden facade details remain unverified. Source screenshots were inspected as visual references; they are not shipped as game textures.

The play structure was corrected using OpenStreetMap way 549848249 (playground=structure), retrieved September 12, 2026. Its center was about 69 metres from the previous approximate placement. Position, orientation and horizontal dimensions now follow the mapped footprint; vertical shape remains an approximation.


## Remaining waterfront route — September 12, 2026

`waterfront-streetview.json` records 12 inspected views across Second, Brannan, the actual Bay Trail promenade, King and Third, including a ballpark-facing view. Google may snap requested coordinates to nearby imagery; the visible label is recorded separately. The additional initial Second/Brannan corner view was also inspected but is not included in this 12-view list. No Street View photos are shipped as textures.

`waterfront-parks-osm.json`, `waterfront-trees-osm.json`, `waterfront-lamps-osm.json`, `waterfront-rail-osm.json`, and `oracle-park-full-osm.json` retain source geometry. `scripts/build-waterfront-scenery.py` projects those sources into `game/scenery/data/waterfront-geometry.ts`. Palm status comes only from `leaf_type=palm`. Heights, foliage, lamp designs, inset lawns, facade bays, lane widths and stadium elevations are approximate; the stadium outline is a perimeter, not a surveyed wall footprint. Unmatched buildings still use the earlier generic materials. No claim of photogrammetry or complete street-by-street surveying.


### Park refinement
Five additional park views are recorded in `park-streetview.json`, including two April 2019 user-contributed panoramas at South Beach Park and three official 2025 views. The two older images establish lawn/seating context, not a claim of current survey accuracy. Current mapped bench, path, lawn and artwork data is retained in `south-beach-details-osm.json`, `brannan-wharf-details-osm.json` and `south-beach-art-osm.json`. Brannan Wharf's lawn uses its own mapped polygon. The open canopy uses existing mapped footprint 443021970. South Beach's lawn mound, planting edge, bench orientation, Sea Change's sculptural form and all vertical dimensions are approximations from the references. The playground surface follows its footprint; individual playground equipment has not been replicated. South Park keeps the earlier reference-informed layout with improved turf material.


## Road markings
`route-crosswalks-osm.json`, `route-bike-lanes-osm.json` and `route-cycleways-osm.json` are OSM snapshots covering both game routes. `scripts/build-road-markings.py` preserves tags and projects coordinates. Only explicit crossing paint tags (zebra, ladder, lines, yes) generate crosswalk markings; unknown/no paint is skipped. Bicycle side tags and separately mapped cycleways take priority. Rendering is limited to the visible course neighborhood. Road-side offsets and marking widths fit the simplified game road width, and are not surveyed lane-edge coordinates. Second Street's green cycle-track paint, white posts, paired yellow centerline, and 1 South Park facade details come from the user's May 2025 Street View screenshot labeled 559 2nd St. Other bike lanes receive white markings without assuming green paint. The crossing paths' widths are representative.

### The Brannan courtyard (September 12 update)
The user’s May 2025 Street View screenshot, camera label 250 Brannan St, shows the landscaped entrance to The Brannan across the street. `brannan-courtyard-osm.json` records residential site 233785893 and footways 1169522854–1169522862. These mapped paths and adjacent tower footprints locate the courtyard. Cream raised planter walls, clipped hedges, shrubs, paving and canopy trees are modeled from the supplied image; bed outlines, planting positions and heights are visual approximations, not surveyed data. Tower facade colors are photo-derived approximations. No Street View imagery is shipped as a texture.

### Second and Brannan corner reference
The supplied May 2025 Street View view (camera label 599 2nd St) is used for the Brannan-facing warehouse at OSM footprint 112927451 and adjacent footprint 112927456. Red lower facade, green metal awning, narrow upper windows, fire escapes and gray neighboring facade are modeled approximations. The screenshot's blurred upper area is not treated as reliable detail. Double yellow paint is applied only on the photographed Brannan stretch from Second toward The Brannan courtyard (projected x 250–380); existing public-data crosswalks and intersection bicycle-lane clipping are retained.

### Third Street entrance, supplied May 2025 reference
Camera label 551 3rd St, looking northeast into South Park. OSM footprint 124889461 is modeled as the open Shell canopy with pumps, rather than the imported solid building. Forecourt details and sign approximate the screenshot, with no fuel prices reproduced. Footprint 124884339 receives pale glass facade framing. The long gas-station-facing wall of 181 South Park (124889463) stays largely blank, with glazing toward the park entrance. West-entrance parking faces the northwest curb; a modeled bike dock occupies the southeast side. Parking spacing, pump positions and facade dimensions are visual estimates; mapped building footprints and street centerlines are preserved.

### Complete waterfront intersection pass
`intersection-streetview.json` records 14 junctions, requested Street View camera coordinates, headings, visible imagery dates, and observations. Screenshots were captured and visually inspected in Google Maps during this session (including alleys and the promenade exit). A second Delancey capture replaced a 2015 panorama with a nearby May 2025 view; Varney was inspected in both directions. Coverage was checked against shared map nodes and geometric road crossings. This pass covers the waterfront circuit, not the longer VC alternative.
Changes include corner facade colors/window patterns, De Boom's red shelter, paired Brannan waterfront lamps, double yellow farther along Brannan, green cycle paint where seen on King/Third, and shortening Third's red transit paint to north of Townsend. Source footprints and tagged bicycle facilities remain authoritative; fixture placements, facade elevations and small architectural details are approximations from the screenshots. Cycleway markings still stop at intersections per the requested game treatment, even where a source photo shows green crossing blocks. No temporary construction barriers, historical advertising or photographed fuel prices are added.

## Oracle Park entrance reference

`game/scenery/oracle-park.ts` uses the user-supplied Street View screenshot labeled 85 King St, May 2025, for the Second Street Gate: red brick, pale stone base and coping, tall dark window grids, corner clock tower, Oracle Park entrance lettering, and exposed steelwork. The OSM perimeter remains the location source; tower dimensions, clock time, banner artwork, and facade elevations are modeled approximations. The banner is a simplified Giants graphic, not a reproduction of the photographed advertisement.

King Street update (September 2026): the supplied May 2025 Street View at 85 King St
is the visual reference for the park-side carriageway. The course follows the Embarcadero roadway from Brannan and joins King at
[603.67, 470.49], staying on the park-side carriageway until Third Street.
The promenade is retained as scenery rather than part of the race route. Each King carriageway is
modeled as 9.6 m wide, with a narrow curbside bicycle lane, white lane divisions,
continuous green bike-lane paint, and a low green metal railing at the
transit median. South Beach Park's street edge has red flowering beds. Widths,
railing dimensions and planting detail are photo-based estimates, not a survey.

The Embarcadero roadway uses a 9.6 m carriageway estimate. The promenade is a
3 m pedestrian ribbon without road-crossing connectors, keeping it clear of
the roadway beside Pier 38; palm trunks are offset into the median where necessary to clear the road edges.

## King Street approach and Bay Bridge references

The supplied May 2025 King Street and Embarcadero screenshots guide the northeast-facing Oracle Park roof sign, decorative marina sailboats, supplemental South Beach Park planting, and distant Bay Bridge silhouette. `game/scenery/south-beach-marina.ts` keeps boats beyond the modeled shoreline and new trees inside the park with road/path clearance. `game/scenery/bay-bridge.ts` approximates the western suspension spans in local coordinates; dimensions and placement are illustrative, not surveyed. Existing source geometry remains unchanged by these scenery additions.

## South Beach harbor buildings

The user-supplied May 2025 view from 89 The Embarcadero S guides `game/scenery/harbor-buildings.ts`: low cream harbor buildings, blue trim, Frankie’s sign, picnic tables, and timber patio fencing. The modeled cafe and Bike Hut replace generic blocks for OSM footprints 148551355 and 572156641; heights and patio layout are visual estimates. `public/textures/harbor-octopus-mural.png` is AI-generated original artwork inspired by the photographed mural, not a photograph or exact reproduction of it. Its texture is disposed with the world.

## Delancey Street Restaurant

The supplied May 2025 image at 160 Brannan guides `game/scenery/delancey-street.ts`: terracotta stucco, forest-green and cream striped canvas awnings, burgundy entries, cream upper window frames and loggia columns, curved dark balcony railings, and a low brick terrace wall with transparent glass wind screens. The restaurant retains footprint 125401316; the terrace uses footprint 125401311 in place of its generic tall block. Colors, heights, and furniture are photo-based approximations.

## Brannan waterfront view

`game/scenery/brannan-waterfront.ts` uses the supplied May 2025 view from 2 Brannan Street for three red waterfront columns with dark crowns and gold bands, and the long single-story white pier building with green openings to the south/right. Placement, building dimensions, colors, and opening spacing are visual estimates, preserving the open central bay view.

The user identified the white waterfront building as Pier 38. `game/scenery/pier-38.ts` therefore uses existing footprint 104599982 (about 290 m in extent), replacing its generic facade rather than adding a second shed. The complete pier gets low white walls, green openings, gridded glazing, and Pier 38 lettering, including surfaces beyond the near-road detail cutoff.

The subsequent front reference at 691 The Embarcadero distinguishes the taller two-story street frontage from the low pier shed. The entrance now includes a central triangular pediment, layered arch molding, tall gridded entry glazing, paired window levels, cream pilasters/cornices, and pediment lettering. The original long pier footprint is retained.

## Private garden at Brannan and Delancey

`game/scenery/delancey-garden.ts` models the planted corner shown in the supplied May 2025 view from 198 Brannan: a low terracotta boundary with black iron railings, mature tree canopy, interior paths/seating, and pale sidewalk bollards. Garden bounds and furnishings are photo-based estimates placed between the existing road and building footprints; the enclosure remains private scenery.

## Embarcadero heritage lamps

`game/scenery/embarcadero-lamps.ts` follows the supplied May 2025 view at 637 The Embarcadero S: dark green tapered posts, fluted cast bases, decorative collars, faceted warm glass lanterns, peaked caps and finials. Mapped waterfront lamp positions are retained; gaps along the waterside sidewalk receive estimated infill positions outside building footprints, separated from existing lamps. No additional real-time point lights are added.

## Pier 38 waterside details

The supplied May 2025 close-up from 675 The Embarcadero guides `game/scenery/waterfront-railings.ts`: five horizontal metal rails between pale concrete posts following the retained Brannan Wharf shoreline, and a black-and-ivory banded square marker. `game/scenery/bay-water.ts` adds shared procedural color/bump maps with slow wind-ripple movement and a muted bay-water palette. Both water textures are released during world teardown.

The supplied view at 600 The Embarcadero shows the restaurant continuing onto footprint 125401320. This wing now shares the terracotta facade, a longer striped canopy along the waterfront and its patio-facing return, and repeated restaurant lettering. The Brannan canopy remains limited to the short corner section. Flower boxes sit below the terrace glass; the patio is built once for both wings.

The additional Brannan/Embarcadero corner photo corrects footprint 125401311: it is the substantial rounded restaurant building, not an open terrace. The model now uses a three-story terracotta corner with cream loggia columns, railings and a hipped roof. A continuous mitered green/cream canopy follows its perimeter; a shallow brick/glass seating strip hugs the outer corner. Dimensions are photo-based estimates.

Bayside Village corner: the supplied May 2025 Brannan/Embarcadero screenshot
informs the pale three-story finishes on footprints 37058279 and 37058283,
green corner roof cap, dark café canopy, circular entrance monument, flagpole,
cream bollards, planters and branching trees. `bayside-village.ts` places the
plaza north of Brannan, west of the Embarcadero; dimensions and furnishings are
photo-based estimates. Existing surveyed crossings and signals are retained.

The supplied 652 The Embarcadero S view guides `delancey-courtyard.ts`: paired sand-colored entrance bays, recessed terracotta walls, an overhead arched connector, iron double gates and fencing, planted courtyard, and a small rear fountain. It occupies the gap between footprints 125401320 and 125401313; placement and dimensions are estimates from the photo and mapped footprints.

The supplied views near 654 and 684 Embarcadero guide `delancey-waterfront-gardens.ts`: a private planted garden behind terracotta walls and black ironwork, followed by a public paved green with edged lawn beds, wooden benches, bollards and broadleaf trees. Placement is estimated in the open land south of footprint 125401313, clear of the neighboring Townsend buildings.

Pier 40 now uses the supplied 731 Embarcadero view: cream warehouse walls and dark industrial glazing replace the generic brick footprint. The entrance has curved pale paving inlays, panel joints, white flower planters, yellow bollards and drain grates. Five boats are moored along the pier apron with fenders and mooring lines. Dimensions and boat arrangement are modeled estimates.

The extended promenade now retains its mapped widths with individual approximately 2m concrete panels, narrow joints, pale edge bands and curb depth. The supplied 31 King Street photo guides the Oracle approach border: red/pink flowers, clipped shrubs, tall black iron fencing and broadleaf trees behind the sidewalk. All decorative dimensions are estimates, not surveyed measurements.


Townsend/Embarcadero: the supplied January 2025 image guides the South Beach
Marina Apartments corner in `townsend-corner.ts`: curved paved forecourt,
circular concrete hedge planter and white identification sign, lawns, pale
colonnade, hipped roofs, bollards and sparse winter trees. Existing footprints
288647983, 288647982 and 288648572 retain their mapped positions; facade colors
and scene dimensions are photo-based estimates. The planting is set back from
both carriageways and the existing crossing geometry is retained.

Pier 40 entrance correction from the in-game comparison: extend the approach paving to the sidewalk, place 14 decorative white planters along both curved borders and the street end, and use a repeating running-bond block texture with mortar bump detail. The entrance remains open between planter rows.

The 753 Embarcadero reference corrects the Oracle border extent: fencing, dense flower beds and supplemental shrubs are restricted to the stadium end, leaving the sculpture lawn frontage open.

Muni median paving: the supplied Embarcadero/King approach photo guides the
staggered gray cobblestone track bed and pale sandstone-colored palm surrounds.
`muni-paving.ts` clips paving outside the prepared road, promenade and bicycle
surfaces; embedded steel rails remain visible above the stone without exposed
sleepers. Texture scale and colors are modeled estimates from the reference.

Muni median layout refinement: the track pair stays central, with palm planting
rows on its two outer sides. Blue twin-arm lamps fill gaps within those rows.
Tree clearance now reserves the full tram corridor in addition to road and bike
surfaces. Rail heads use brighter steel over dark raised bases, topping out at
0.205 m above the modeled ground (0.12 m above the cobblestone surface).

Oracle Park approach correction: omit generic relation -7330762, which was rendering a 30m apartment-textured duplicate behind the custom stadium. Replace the nearby service footprints with low utility frontage; add brick floor spandrels, cream horizontal bands and a pyramidal clock roof. The large approach lettering sits on an open steel frame rather than a solid signboard.
