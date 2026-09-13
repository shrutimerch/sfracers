# South Park visual survey

Ten Google Street View screenshots were inspected in the browser on September 12, 2026. All showed January 2025 imagery. The JSON records requested viewpoints, visible location labels and observations. Street View labels are approximate camera locations, not proof of a building address. Facade profiles use legible addresses plus OSM footprint addresses where available. Views obscured by trees and cars do not verify hidden details.

Changes: address-specific palette and window styles; estimated storey heights; industrial window grids and arches; siding and brick coursing; entrance paving; taller winter tree silhouettes. Exact pole, tree species, dimensions and hidden facade details remain unverified. Source screenshots were inspected as visual references; they are not shipped as game textures.

The play structure was corrected using OpenStreetMap way 549848249 (playground=structure), retrieved September 12, 2026. Its center was about 69 metres from the previous approximate placement. Position, orientation and horizontal dimensions now follow the mapped footprint; vertical shape remains an approximation.


## Remaining waterfront route — September 12, 2026

`waterfront-streetview.json` records 12 inspected views across Second, Brannan, the actual Bay Trail promenade, King and Third, including a ballpark-facing view. Google may snap requested coordinates to nearby imagery; the visible label is recorded separately. The additional initial Second/Brannan corner view was also inspected but is not included in this 12-view list. No Street View photos are shipped as textures.

`waterfront-parks-osm.json`, `waterfront-trees-osm.json`, `waterfront-lamps-osm.json`, `waterfront-rail-osm.json`, and `oracle-park-full-osm.json` retain source geometry. `scripts/build-waterfront-scenery.py` projects those sources into `app/waterfront-geometry.ts`. Palm status comes only from `leaf_type=palm`. Heights, foliage, lamp designs, inset lawns, facade bays, lane widths and stadium elevations are approximate; the stadium outline is a perimeter, not a surveyed wall footprint. Unmatched buildings still use the earlier generic materials. No claim of photogrammetry or complete street-by-street surveying.


### Park refinement
Five additional park views are recorded in `park-streetview.json`, including two April 2019 user-contributed panoramas at South Beach Park and three official 2025 views. The two older images establish lawn/seating context, not a claim of current survey accuracy. Current mapped bench, path, lawn and artwork data is retained in `south-beach-details-osm.json`, `brannan-wharf-details-osm.json` and `south-beach-art-osm.json`. Brannan Wharf's lawn uses its own mapped polygon. The open canopy uses existing mapped footprint 443021970. South Beach's lawn mound, planting edge, bench orientation, Sea Change's sculptural form and all vertical dimensions are approximations from the references. The playground surface follows its footprint; individual playground equipment has not been replicated. South Park keeps the earlier reference-informed layout with improved turf material.


## Road markings
`route-crosswalks-osm.json`, `route-bike-lanes-osm.json` and `route-cycleways-osm.json` are OSM snapshots covering both game routes. `scripts/build-road-markings.py` preserves tags and projects coordinates. Only explicit crossing paint tags (zebra, ladder, lines, yes) generate crosswalk markings; unknown/no paint is skipped. Bicycle side tags and separately mapped cycleways take priority. Rendering is limited to the visible course neighborhood. Road-side offsets and marking widths fit the simplified game road width, and are not surveyed lane-edge coordinates. Second Street's green cycle-track paint, white posts, paired yellow centerline, and 1 South Park facade details come from the user's May 2025 Street View screenshot labeled 559 2nd St. Other bike lanes receive white markings without assuming green paint. The crossing paths' widths are representative.

### The Brannan courtyard (September 12 update)
The user’s May 2025 Street View screenshot, camera label 250 Brannan St, shows the landscaped entrance to The Brannan across the street. `brannan-courtyard-osm.json` records residential site 233785893 and footways 1169522854–1169522862. These mapped paths and adjacent tower footprints locate the courtyard. Cream raised planter walls, clipped hedges, shrubs, paving and canopy trees are modeled from the supplied image; bed outlines, planting positions and heights are visual approximations, not surveyed data. Tower facade colors are photo-derived approximations. No Street View imagery is shipped as a texture.

### Second and Brannan corner reference
The supplied May 2025 Street View view (camera label 599 2nd St) is used for the Brannan-facing warehouse at OSM footprint 112927451 and adjacent footprint 112927456. Red lower facade, green metal awning, narrow upper windows, fire escapes and gray neighboring facade are modeled approximations. The screenshot's blurred upper area is not treated as reliable detail. Double yellow paint is applied only on the photographed Brannan stretch from Second toward The Brannan courtyard (projected x 250–380); existing public-data crosswalks and intersection bicycle-lane clipping are retained.
