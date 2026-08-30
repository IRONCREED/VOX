# Public architecture

IRONCREED is a bilingual React and Vinext publication interface projected from
a governed semantic core. The public source distribution preserves the runtime
boundary while exposing the adopted governance and enforcement surface needed
to audit how a release is controlled.

## Application layers

| Path                           | Public responsibility                                                    |
| ------------------------------ | ------------------------------------------------------------------------ |
| `app/`                         | Localized routes, metadata, manifest, robots policy, and public API      |
| `src/content-catalog/`         | Typed reads from the sealed public corpus projection                     |
| `src/interface-system/`        | Components, templates, behaviors, and visual contracts                   |
| `src/site-navigation/`         | Build identity and navigation behavior                                   |
| `worker/`                      | Cloudflare-compatible request entry point and route normalization        |
| `content/config/`              | Public interface copy, categories, hints, navigation, and audio metadata |
| `public/audio/`                | User-initiated same-origin anthem asset                                  |
| `semantic-core/dist/site/`     | Generated public runtime data for the released corpus                    |
| `tests/`                       | Public source and rendered-artifact checks                               |
| `scripts/sitemaps.mjs`         | Deterministic localized route and question sitemap generation            |
| `code-constitution/`           | Pinned universal Code Constitution Git submodule                         |
| `repository-licensing-policy/` | Pinned Repository Licensing Policy Git submodule                         |
| `governance/`                  | Adopted Profile, acts registry, and project legislation                  |
| `constitutional-guard/`        | IRON WARDEN runner, integrity history, and canonical/public checks       |

The live editorial source, reusable entity registries, material intake,
operational prompts, attestations, internal reports, and the Custom GPT
projection remain in the canonical private repository. The exported runtime
data contains only the already released site projection.

## Release model

The canonical project validates and seals the corpus before VOX is assembled.
The exporter then copies only paths named by `publication-policy.json`, creates
a public package manifest, scans for restricted paths and secret forms, checks
English public documentation, and writes a digest manifest. Publication creates
an atomic Git commit from that verified directory and the policy-pinned
two policy-pinned gitlinks.

The WARDEN runner detects `VOX-PUBLICATION.json`. In a VOX checkout it executes
the dedicated public prebuild and postbuild suites while always verifying the
full immutable historical manifest. In the canonical checkout it executes the
canonical current and active historical release checks. This preserves one
public command surface without requiring private editorial records.

TheWorldOfCanon is a separate archival projection. A VOX publication neither
mutates nor implicitly authorizes a TheWorldOfCanon pull request.

## Search projection

The public search surface is deliberately split into four maps:

| Locale    | General routes          | Question routes              |
| --------- | ----------------------- | ---------------------------- |
| Ukrainian | `/sitemaps/uk/site.xml` | `/sitemaps/uk/questions.xml` |
| English   | `/sitemaps/en/site.xml` | `/sitemaps/en/questions.xml` |

The root `/sitemap.xml` is an index, not a fifth content map. General maps are
derived from published homes, categories, content pages, series, and materials.
Question maps are derived from every `published + public` question in the sealed
entity index. Each question must have a canonical material or page association;
the generator refuses to emit an orphan URL.

A question route does not create a second answer or a synthetic article. It
renders the full Corpus Index, selects the stable question, and exposes its
associated source publications. This lets future search systems address a
long-form corpus at question granularity while preserving provenance and the
authority of the originating materials.
