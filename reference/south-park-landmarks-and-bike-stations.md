# South Park reference corrections

User-supplied January 2025 Street View screenshots, provided September 13, 2026:

- Café Centro: mapped building 124884353, address 102 South Park. Four-level
  modeled elevation: cream café storefront, recessed dark entrance, gray
  scalloped awning and green CENTRO sign, two three-bay arched-window tiers
  with blue-gray molding, rectangular attic sashes, and a projecting dentil
  cornice. Height 14.4m is a visual estimate, not a surveyed measurement.
- Blue Bottle / Two South Park: mapped building 112926339, address 2 South
  Park. Three-level red-brick facade, six broad industrial window bays,
  maroon frames, frosted storefront glass, dark plinth and entrance, fire
  escape and rooftop American flag. Flag has thirteen stripes and fifty
  stars; its folded shape is modeled. Height 13m retains the imported value.

Camera labels in the screenshots are not used as building addresses. The
visible Two South Park doorway and mapped footprint select the second building.
Building footprints are retained. No Street View image is shipped as a texture.
Both facade models batch their geometry by material to limit draw calls.

## Bay Wheels / Lyft stations

Source: https://gbfs.lyft.com/gbfs/2.3/bay/en/station_information.json
The downloaded source is retained in `bay-wheels-station-information.json`.
`scripts/sync-bike-stations.py` includes every non-virtual station with positive
capacity within 50m of the current circuit. The course-generation script also
runs this synchronization.

| Station | Published dock capacity |
| --- | ---: |
| South Park St at 2nd St | 29 |
| South Park St at 3rd St | 29 |
| Brannan St at Colin P Kelly Jr St | 35 |
| Delancey St at Brannan St | 27 |
| The Embarcadero at Pier 38 | 26 |
| 3rd St at King St | 21 |

Bryant at 2nd and 2nd at Townsend are nearby but over 50m off the circuit;
they are excluded by this explicit corridor definition.

Published station coordinates are preserved in the local metre grid. A point
feed does not survey individual docks: rows are centered on those station
anchors and aligned to the nearest mapped street. Dock spacing, kiosk layout
and bike occupancy are estimates. About 40% of docks contain bikes, with a stable scattered selection per station. Empty docks remain visible. Bikes are static scenery, not live availability.

The Third Street entrance has a rendering correction: its feed pin falls in
the driving lane, so `prepareCourse` places the row 26m along South Park and
5.8m to the southeast, in the reserved parking strip. This keeps all 29 docks
beyond the pedestrian crossing and outside the central racing lane. The source
coordinate remains unchanged in the course JSON. The start/finish is at the mapped South Park entrance node
`[-0.04, 580.5]`, about 11m inward from the Third Street centerline. The closed
route and section distances rotate to put lap timing, spawn and finish at this
same entrance, with one checkered line directly
under the gantry, limited to the central driving corridor.

The existing silver step-through, purple-skirt Lyft bicycle model was extracted
from South Park scenery into `game/scenery/bike-stations.ts`. It retains the
two-sided Lyft branding, battery, basket, spokes, pedals, docks and bollards.
All stations reuse this file; the previous two hard-coded rows were removed
from the South Park renderer to prevent duplicates.
