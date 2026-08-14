# IRONCREED VOX

VOX is the reviewed public-source projection of the IRONCREED website. It
contains the application code, the public runtime data required to render the
released interface, build and test configuration, licensing notices, and
English public documentation.

- Website version: `1.2.0`
- Public corpus version: `1.4.0`
- Application source commit: `b381deab353d9048fcb179b0b8e5ad9b833fd6e9`
- Corpus projection source commit: `342b01b6b68546afff96144e01f6404f7bad678a`
- Public content digest: `af3c963e3b393d72705a91935a9d66152f7305d561e97c643f27907f8f6667ea`
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
