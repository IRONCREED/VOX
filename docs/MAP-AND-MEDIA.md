# Map and social media assets

The practice map is an SVG projection generated with pinned `d3-geo` and
`topojson-client` dependencies from `world-atlas` 2.0.2 (Natural Earth 1:110m).
Natural Earth data is public domain: https://www.naturalearthdata.com/about/terms-of-use/.
The dependencies retain their own licences. Run `npm run map:check` to verify
geometry and `npm run map:generate` to regenerate it. No remote map tiles,
tracking, API keys or runtime mapping service are required.

Canonical country assignments and review associations are editorial records.
The public snapshot contains their localized projection. Markers count distinct
client IDs, not assignments. Unknown countries remain in a separate group.
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
