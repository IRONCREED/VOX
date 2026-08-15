# IRONCREED VOX

VOX is the reviewed public-source projection of the IRONCREED website. It
contains the application code, the public runtime data required to render the
released interface, build and test configuration, licensing notices, and
English public documentation.

- Website version: `1.3.0`
- Public corpus version: `1.5.0`
- Application source commit: `88b3ec911b88c9bd9cd5fefd87d456d7ef4684d5`
- Corpus projection source commit: `bf555570644019fcd4608e2458354b4a25cf084a`
- Public content digest: `d7a4a04a7a1aa19708a4316a05f2e94a6e5dca18419cd3d72a9dbc18b500e075`
- Production site: <https://ironcreed-credo.ironcreed.chatgpt.site>

The private Sites repository remains the canonical engineering source. VOX is a
deterministic, fail-closed distribution produced by
[`publication-policy.json`](publication-policy.json). It is deliberately
incapable of carrying internal governance, editorial intake, private prompts,
Custom GPT packages, deployment identity, credentials, caches, or temporary
files.

## Run locally

Use Node.js 22 or later.

```bash
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

## Public documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Publication boundary](docs/PUBLICATION-BOUNDARY.md)
- [Security](docs/SECURITY.md)
- [Licensing map](LICENSE.md)
- [Notices](NOTICE.md)

## Publication integrity

`VOX-PUBLICATION.json` records every exported path, byte size, SHA-256 digest,
release version, source commit, and content digest. The publishing script
creates one new Git tree and advances `main` without a forced update. It refuses
to overwrite a non-empty repository that lacks the prior managed marker.
