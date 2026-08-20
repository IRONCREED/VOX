# IRONCREED VOX

VOX is the reviewed public-source projection of the IRONCREED website. It
contains the application code, the public runtime data required to render the
released interface, the adopted project governance and IRON WARDEN audit
surface, build and test configuration, licensing notices, and English public
documentation.

- Website version: `1.4.0`
- Public corpus version: `1.6.0`
- Application source commit: `9b0997acfa20964f109c83732e1b1506899f6c03`
- Corpus projection source commit: `65fc3dab920ac5d0c5069c789d8e5e46aa3bee71`
- Public content digest: `ab0788f27b23cbf0f559984d98c9205eb616c8bf01f29f0e3bd16afc79a08607`
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

The universal Code Constitution is a pinned Git submodule at
`code-constitution`. `CONSTITUTION.md`, `governance/PROFILE.md`, the project
legislation, its acts registry, and `constitutional-guard/` expose the adopted
project rules and their verifier. `npm run guard:integrity` verifies the
published WARDEN history; full prebuild and postbuild enforcement remains bound
to the canonical source tree because the private editorial corpus is not part
of VOX.

## Public documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Publication boundary](docs/PUBLICATION-BOUNDARY.md)
- [Security](docs/SECURITY.md)
- [Licensing map](LICENSE.md)
- [Notices](NOTICE.md)

## Publication integrity

`VOX-PUBLICATION.json` records every exported path, byte size, SHA-256 digest,
pinned gitlink, release version, source commit, and content digest. The publishing script
creates one new Git tree and advances `main` without a forced update. It refuses
to overwrite a non-empty repository that lacks the prior managed marker.
