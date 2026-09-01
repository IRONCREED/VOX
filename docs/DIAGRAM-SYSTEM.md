# IRON CREED diagram system

Status: normative implementation guide for release `1.10.0`.

## Contract

The diagram system follows one direction:

`semantic-core → projection → layout → renderer → publication`

The canonical record is an `asset.*` entity in
`semantic-core/corpus/assets/registry.json`. React Flow and ELK are render-time
dependencies, not data formats. Exported SVG, WebP and PNG files are derived
representations and may always be rebuilt.

This release creates the infrastructure only. Existing 57 assets remain
`editorial-request` records; no brief has been silently converted into a
diagram and no coordinates have been invented.

## Declaration

An implemented asset changes its `assetType` to `diagram` and adds a declaration:

```json
{
	"id": "asset.constitution-runtime-05-article-iii.g05",
	"assetType": "diagram",
	"diagram": {
		"source": "view.constitution-runtime-05-article-iii",
		"projection": "lineage",
		"renderer": "graph",
		"preset": "constitution-runtime",
		"representations": ["interactive", "publication"],
		"nodes": [],
		"relations": []
	}
}
```

The complete machine contract is
`semantic-core/schemas/diagram.schema.json`. Every node may reference one
existing canonical entity. A rendered relation may reference an existing
canonical relation. The projection owns labels, emphasis, grouping and the
smallest necessary layout override; it does not clone the entity.

## Supported projections and renderers

| Projection                                   | Default renderer  | Purpose                                     |
| -------------------------------------------- | ----------------- | ------------------------------------------- |
| `flow`, `lifecycle`, `gate`                  | React Flow + ELK  | Directed processes and safe rejection       |
| `lineage`, `topology`, `navigator`, `warden` | React Flow + ELK  | Graph structure, question routes and traces |
| `matrix`                                     | CSS Grid/SVG      | Tests, sources and invariant tables         |
| `comparison`                                 | React Flow or SVG | Parallel models from shared entities        |
| `hero`                                       | React Flow or SVG | Fixed publication composition               |

Node roles are `artifact`, `actor`, `process`, `decision`, `state`, `source`,
`boundary` and `human-decision`. Relations are `requires`, `produces`,
`validates`, `rejects`, `derives`, `supersedes`, `executes`, `returns` and
`references`.

## Visual and interaction contract

Design tokens encode active routes in blue, confirmed/passed states in gold,
rejection or conflict in red, human decisions in a light boundary and
secondary structure in graphite. Line shape also encodes relation semantics;
colour is never the only signal. IDs and trace values use monospace.

Interactive representation may pan, zoom, focus and reveal related edges. It
never enables editing or drag persistence on a public article. Publication
representation uses a stable viewport, deterministic ELK settings, no editing
controls and required localized `alt`, `title`, caption and provenance.

All article Markdown blockquotes beginning with the localized label
`Graphic slot G##` are already rendered as styled asset briefs. When the
corresponding asset is promoted to `diagram`, the same article slot renders the
canonical diagram without changing the article body.

## Series

A series should prefer one shared system asset with multiple modes and
projections. Constitution Runtime may introduce
`asset.constitution-runtime.system`; Articles VII–I then select a projection,
mode, active entities and local labels. Shared nodes and relations are never
copied between article assets.

## Creating an asset

1. Confirm the stable asset ID and existing source entity/view.
2. Select a projection, renderer and IRON CREED preset.
3. Reference existing entities and canonical relations where available.
4. Add only diagram-specific entities that have independent meaning.
5. Supply both localizations and publication accessibility metadata.
6. Run `npm run corpus:validate` and rebuild projections from the source commit.
7. Check desktop/mobile interactive rendering.
8. Declare publication targets through `DIAGRAM_PUBLICATION_TARGETS` and run
   `npm run diagram:export` for deterministic screenshots.
9. Run the full `npm run check` and WARDEN release gate.

The exported files are output. The declaration and any explicit
projection-specific overrides are source.
