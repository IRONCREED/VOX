# Question-level discovery

IRONCREED treats a long-form publication as the authoritative object and its
reviewed standalone questions as stable discovery units. The purpose is not to
split an article into synthetic thin pages. It is to let a reader or search
system address one precise question and then recover every public source
material that canonically participates in answering it.

We see question-level discovery as part of the future of search systems:
retrieval can begin at question granularity without discarding the provenance,
context, authorship, or versioned body of the originating publication.

## Public URLs

Only questions receive generated entity routes:

```text
/{locale}/questions/{stable-question-id}
```

The route renders the ordinary Corpus Index, selects and expands the requested
question, and lists its associated public materials or content pages. It also
publishes localized canonical and alternate metadata plus `QAPage` structured
data. Concepts, claims, sources, protocols, and assets remain index entities but
do not receive equivalent generated routes.

## Four content maps

| Locale    | General map             | Question map                 |
| --------- | ----------------------- | ---------------------------- |
| Ukrainian | `/sitemaps/uk/site.xml` | `/sitemaps/uk/questions.xml` |
| English   | `/sitemaps/en/site.xml` | `/sitemaps/en/questions.xml` |

`/sitemap.xml` is a sitemap index that names these four files. It is not a fifth
content map. `robots.txt` advertises the index.

General maps contain the locale home, categories, public content pages, material
series, and materials. Question maps contain every and only `published + public`
question in the sealed site projection. Each entry carries Ukrainian, English,
and `x-default` alternates.

## Deterministic generator

The generator reads:

- `content/config/categories.json`;
- `semantic-core/dist/site/materials.json`;
- `semantic-core/dist/site/pages.json`;
- `semantic-core/dist/site/series.json`;
- `semantic-core/dist/site/questions.json`;
- `semantic-core/dist/site/entities.json`;
- the canonical public origin.

Run an explicit rebuild only when one of those inputs or the route contract
changes:

```bash
npm run sitemaps:build
```

Ordinary checks are non-mutating:

```bash
npm run sitemaps:check
```

The generator refuses duplicate general URLs, missing bilingual route pairs,
question-count drift, and a question that has no public material or page
association. The check fails when any committed XML differs from the output
that the sealed projection would generate.
