# Map and social media assets

The practice map is an SVG projection generated with pinned `d3-geo` and
`topojson-client` dependencies from `world-atlas` 2.0.2 (Natural Earth 1:110m).
Natural Earth data is public domain: https://www.naturalearthdata.com/about/terms-of-use/.
The dependencies retain their own licences. Run `npm run map:check` to verify
geometry and `npm run map:generate` to regenerate it. No remote map tiles,
tracking, API keys or runtime mapping service are required.

Canonical country assignments and review associations are editorial records.
The public snapshot contains their localized projection. Markers count distinct
client IDs, not assignments. One approved relationship may receive map credits
in several countries; their sum can exceed the global distinct-client count.
Owned work has no inferred country or client credit and appears separately.
All projects and original review texts are server-rendered and accessible
without JavaScript. Interactive filters and native disclosure controls retain
keyboard access. Geography refers to the organisation or project, not a
reviewer's nationality or residence.

The WebP files under `public/media/social/` are IRONCREED visual identity assets:
all rights reserved. The main card was created from the owner-supplied current
logo; the six editorial covers were adapted from owner-supplied artwork, with
the brand spelling corrected and the original topics retained. The page
metadata registry is `content/config/social-previews.json`. Cover mappings use
stable material and series IDs and never replace publication prose.

The main site's publication policy is reviewed independently of the Cycle
landing. Only its approved public projection reaches this consumer; private
registry notes, editorial documents and publication reasons are excluded.
Explicit parent relations form nested project disclosures with CSS tree lines.
Named embedded services appear within their carrying project, while other typed
relations remain labelled cross-links. Alphabetical sorting uses the active
locale at each sibling level.

The map selects a country. One button opens work-type choices, which intersect
with the selected country. Applying either facet scrolls and focuses results,
respecting reduced motion. Matching children retain their parent context.
Following a project cross-link resets facets and opens the target's ancestors.
The compact note retains the original review-source statement, 200+ cases and
mapped work since 2019, and separate studio game projects. A fourth paragraph
acknowledges the closed registry and links to LinkedIn for contract experience
without public artifacts.

The geometry generator transfers the original Crimea polygon from Natural
Earth's default de facto Russia feature to Ukraine and dissolves the internal
border. Other countries and the coastline are preserved. The United States
includes its contiguous area, Alaska and Hawaii. The geographic source test
checks representative locations, other features and total area.
