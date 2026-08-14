# Public architecture

IRONCREED is a bilingual React and Vinext publication interface projected from
a governed semantic core. The public source distribution preserves the runtime
boundary without exposing the private editorial and governance topology.

## Application layers

| Path                       | Public responsibility                                                  |
| -------------------------- | ---------------------------------------------------------------------- |
| `app/`                     | Localized routes, metadata, manifest, robots policy, and public API    |
| `src/content-catalog/`     | Typed reads from the sealed public corpus projection                   |
| `src/interface-system/`    | Components, templates, behaviors, and visual contracts                 |
| `src/site-navigation/`     | Build identity and navigation behavior                                 |
| `worker/`                  | Cloudflare-compatible request entry point and route normalization      |
| `content/config/`          | Public interface copy, categories, hints, and navigation configuration |
| `semantic-core/dist/site/` | Generated public runtime data for the released corpus                  |
| `tests/`                   | Public source and rendered-artifact checks                             |

The live editorial source, reusable entity registries, material intake,
governance, WARDEN history, attestations, and the Custom GPT projection remain
in the canonical private repository. The exported runtime data contains only
the already released site projection.

## Release model

The canonical project validates and seals the corpus before VOX is assembled.
The exporter then copies only paths named by `publication-policy.json`, creates
a public package manifest, scans for restricted paths and secret forms, checks
English documentation, and writes a digest manifest. Publication creates an
atomic Git commit from that verified directory.

TheWorldOfCanon is a separate archival projection. A VOX publication neither
mutates nor implicitly authorizes a TheWorldOfCanon pull request.
