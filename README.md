# IRONCREED VOX

VOX is the reviewed public-source projection of the IRONCREED website. It
contains the application code, the public runtime data required to render the
released interface, the adopted project governance and IRON WARDEN audit
surface, build and test configuration, licensing notices, and English public
documentation.

- Website version: `1.16.0`
- Public corpus version: `1.16.0`
- Application source commit: `042a82c7c29ac9a288397507fb6b6c556a7afac9`
- Corpus projection source commit: `ae24873cbde3e41d1270d7b01220f2ff537d89f7`
- Public content digest: `2247070a7d413792b654dee3ebcf30253a03ae6699702018cc0b6c44d21d2008`
- Production site: <https://ironcreed-credo.ironcreed.chatgpt.site>

The private Sites repository remains the canonical engineering source. VOX is a
deterministic, fail-closed distribution produced by
[`publication-policy.json`](publication-policy.json). It is deliberately
incapable of carrying operational prompts, attestations, internal reports,
editorial intake, Custom GPT packages, deployment identity, credentials,
caches, or temporary files.

## Run locally

Use Node.js 22 or later.

```bash
git submodule update --init --recursive
npm ci
npm run check
npm run dev
```

The checked-in `semantic-core/dist/site` directory contains the sealed public
runtime projection used by this release. It is generated upstream and must not
be edited manually in VOX.

Every new production deployment is completed with a verified VOX snapshot.
The application source commit recorded above and in `VOX-PUBLICATION.json`
identifies the exact canonical Sites state behind that deployment.

## Question discovery

IRONCREED publishes four generated XML maps: a general route map and a question
map for each of the Ukrainian and English locales. The root `sitemap.xml` is an
index of those four maps. `npm run sitemaps:check` proves that the checked XML
matches the sealed public runtime projection; `npm run sitemaps:build` performs
the explicit regeneration when released routes or questions change.

Question-map URLs use `/{locale}/questions/{stable-question-id}`. They render
the official Corpus Index opened on the named question and show every public
material or page canonically associated with it. Other index entity kinds do
not receive parallel generated routes.

We treat question-level discovery as a likely direction for future search:
long-form publications remain the authoritative objects, while their explicit,
standalone questions become stable retrieval and navigation units. This avoids
fabricating thin derivative pages and lets a search system move from a precise
question back to the complete set of source materials that actually address it.

The universal Code Constitution and the Repository Licensing Policy are pinned
Git submodules at `code-constitution` and `repository-licensing-policy`.
`CONSTITUTION.md`, `governance/PROFILE.md`, the project legislation, its acts
registry, and `constitutional-guard/` expose the adopted project rules and their
verifier.

The public repository includes a complete executable WARDEN surface:
`npm run guard:prebuild`, `npm run guard:postbuild`, `npm run guard`, and
`npm run guard:integrity`. Public prebuild and postbuild checks enforce the
sealed runtime projection, release marker, same-origin media, brand, build, and
publication boundary. The private canonical tree runs a broader test set over
the editorial sources that are intentionally absent from VOX; the runner
selects the appropriate current checks without weakening the immutable history
integrity check.

## Public documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Question-level discovery](docs/QUESTION-DISCOVERY.md)
- [Publication boundary](docs/PUBLICATION-BOUNDARY.md)
- [Security](docs/SECURITY.md)
- [Licensing map](LICENSE.md)
- [Notices](NOTICE.md)

## Publication integrity

`VOX-PUBLICATION.json` records every exported path, byte size, SHA-256 digest,
pinned gitlink, release version, source commit, and content digest. The publishing script
creates one new Git tree and advances `main` without a forced update. It refuses
to overwrite a non-empty repository that lacks the prior managed marker.
