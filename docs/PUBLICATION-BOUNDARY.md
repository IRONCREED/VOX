# Publication boundary

VOX follows an allowlist. A file is public because the policy names its exact
path or places its source tree under an explicit extension contract. Absence
from the allowlist means exclusion; discretion at publish time is not a policy.

## Included

- application, component, template, worker, and adapter source code;
- public interface configuration, brand assets, and generated XML sitemaps
  required by the build;
- the deterministic sitemap generator and its non-mutating verification mode;
- the sealed `site` runtime projection;
- public build, formatting, linting, type-checking, and test configuration;
- the adopted project Constitution wrapper, Founding Profile, acts registry,
  and project Legislation;
- IRON WARDEN source, immutable historical tests, integrity manifest, and its
  stable testing interface;
- the universal Code Constitution as a full-SHA-pinned Git submodule;
- the immutable machine-readable publication policy and digest manifest;
- the licensing map, notices, and English public documentation.

## Excluded

- operational governance prompts, attestations, and internal reports;
- the operational publisher implementation and its repository credential path;
- canonical semantic-core registries, material packages, editorial intake,
  migration evidence, review notes, and unpublished records;
- the Custom GPT package and any private model instructions;
- the canonical Sites hosting manifest, project identifiers, environment
  values, access tokens, private keys, absolute paths, caches, dependencies,
  build output, and temporary files;
- arbitrary attachments, local experiments, and any future path that has not
  received an explicit policy amendment.

## Documentation language

Public documentation is English-only. Ukrainian remains a supported product
locale and therefore appears in application copy and released runtime data; it
does not create a second documentation set.

## Deployment coupling

Every new production deployment is accompanied by a verified VOX snapshot.
`VOX-PUBLICATION.json` records the exact canonical Sites commit, release
versions, public content digest, complete allowlisted file set, and every pinned
gitlink. A deployment
is not accepted as a separate release if its VOX publication has not succeeded.

## Licence boundary

Original code is distributed under MIT. Original non-brand editorial material
and documentation use CC BY-SA 4.0. Names, marks, characters, worlds, brand
assets, and visual identity remain reserved. Third-party terms and file-level
notices take priority.
