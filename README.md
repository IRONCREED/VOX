# IRONCREED VOX

VOX is the reviewed public-source projection of the IRONCREED website. It
contains the application code, the public runtime data required to render the
released interface, the adopted project governance and IRON WARDEN audit
surface, build and test configuration, licensing notices, and English public
documentation.

- Website version: `1.8.0`
- Public corpus version: `1.9.0`
- Application source commit: `63a6428b9299ef96034c9542bd8baf01c754eb5c`
- Corpus projection source commit: `1bb58ee673d9bd4f35eaa2c7e4ede429f577206f`
- Public content digest: `4d6b8da46904a86210d973f3bea74894860ed65460084e1e53caf98832e3b344`
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

The universal Code Constitution is a pinned Git submodule at
`code-constitution`. `CONSTITUTION.md`, `governance/PROFILE.md`, the project
legislation, its acts registry, and `constitutional-guard/` expose the adopted
project rules and their verifier. `npm run guard:integrity` verifies the
published WARDEN history; full prebuild and postbuild enforcement remains bound
to the canonical source tree because the private editorial corpus is not part
of VOX.

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
