import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const supportedLocales = ['uk', 'en'];
const fallbackOrigin = 'https://ironcreed-credo.ironcreed.chatgpt.site';

function escapeXml(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function siteOrigin() {
	const origin = new URL(process.env.NEXT_PUBLIC_SITE_ORIGIN ?? fallbackOrigin);
	if (origin.protocol !== 'https:' && origin.hostname !== 'localhost') {
		throw new Error('Sitemap origin must use HTTPS outside localhost.');
	}
	origin.pathname = '/';
	origin.search = '';
	origin.hash = '';
	return origin;
}

function absoluteUrl(relativePath, origin) {
	return new URL(relativePath, origin).href;
}

function questionPath(locale, questionId) {
	return `/${locale}/questions/${encodeURIComponent(questionId)}`;
}

function latestDate(records) {
	const timestamps = records
		.flatMap((record) => [record.updatedAt, record.publishedAt])
		.filter(Boolean)
		.map((value) => Date.parse(value))
		.filter(Number.isFinite);
	if (timestamps.length === 0) return undefined;
	return new Date(Math.max(...timestamps)).toISOString().slice(0, 10);
}

function localizedPairs(records, key) {
	const pairs = new Map();
	for (const record of records) {
		const id = record[key];
		if (!pairs.has(id)) pairs.set(id, {});
		pairs.get(id)[record.locale] = record;
	}
	return [...pairs.entries()].toSorted(([left], [right]) => left.localeCompare(right));
}

function renderUrlSet(entries, origin) {
	const body = entries
		.map((entry) => {
			const alternates = supportedLocales
				.map(
					(locale) =>
						`\t\t<xhtml:link rel="alternate" hreflang="${locale}" href="${escapeXml(absoluteUrl(entry.alternates[locale], origin))}" />`,
				)
				.join('\n');
			const fallback = `\t\t<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(absoluteUrl(entry.alternates.uk, origin))}" />`;
			const lastmod = entry.lastmod ? `\n\t\t<lastmod>${entry.lastmod}</lastmod>` : '';
			return `\t<url>\n\t\t<loc>${escapeXml(absoluteUrl(entry.path, origin))}</loc>${lastmod}\n${alternates}\n${fallback}\n\t</url>`;
		})
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`;
}

function renderSitemapIndex(origin, lastmod) {
	const paths = supportedLocales.flatMap((locale) => [
		`/sitemaps/${locale}/site.xml`,
		`/sitemaps/${locale}/questions.xml`,
	]);
	const body = paths
		.map(
			(relativePath) => `\t<sitemap>
\t\t<loc>${escapeXml(absoluteUrl(relativePath, origin))}</loc>
\t\t<lastmod>${lastmod}</lastmod>
\t</sitemap>`,
		)
		.join('\n');
	return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`;
}

async function readJson(relativePath) {
	return JSON.parse(await readFile(path.join(projectRoot, relativePath), 'utf8'));
}

function addPairedEntries(entries, pairs, locale, makePath, makeLastmod = () => undefined) {
	for (const [id, pair] of pairs) {
		if (!pair.uk || !pair.en) throw new Error(`Missing localized sitemap pair for ${id}.`);
		entries.push({
			path: makePath(pair[locale]),
			alternates: {
				uk: makePath(pair.uk),
				en: makePath(pair.en),
			},
			lastmod: makeLastmod(pair[locale]),
		});
	}
}

export async function buildSitemapArtifacts() {
	const [categories, materials, pages, questions, series, entities] = await Promise.all([
		readJson('content/config/categories.json'),
		readJson('semantic-core/dist/site/materials.json'),
		readJson('semantic-core/dist/site/pages.json'),
		readJson('semantic-core/dist/site/questions.json'),
		readJson('semantic-core/dist/site/series.json'),
		readJson('semantic-core/dist/site/entities.json'),
	]);
	const origin = siteOrigin();
	const publicQuestions = questions
		.filter((question) => question.status === 'published' && question.visibility === 'public')
		.toSorted((left, right) => left.id.localeCompare(right.id));
	const publicQuestionIds = new Set(publicQuestions.map((question) => question.id));
	const releasedRecords = [...materials, ...series].filter(
		(record) => record.status === 'published',
	);
	const releaseDate = latestDate(releasedRecords) ?? '2026-08-21';
	const artifacts = new Map();

	for (const locale of supportedLocales) {
		const generalEntries = [
			{
				path: `/${locale}/`,
				alternates: { uk: '/uk/', en: '/en/' },
				lastmod: releaseDate,
			},
		];

		for (const category of categories.toSorted((left, right) => left.order - right.order)) {
			generalEntries.push({
				path: `/${locale}/${category.id}`,
				alternates: { uk: `/uk/${category.id}`, en: `/en/${category.id}` },
				lastmod: latestDate(
					releasedRecords.filter(
						(record) => record.locale === locale && record.category === category.id,
					),
				),
			});
		}

		addPairedEntries(
			generalEntries,
			localizedPairs(
				pages.filter((page) => page.status === 'published'),
				'pageId',
			),
			locale,
			(page) => `/${page.locale}/pages/${page.slug}`,
		);
		addPairedEntries(
			generalEntries,
			localizedPairs(
				materials.filter((material) => material.status === 'published'),
				'materialId',
			),
			locale,
			(material) => `/${material.locale}/${material.category}/${material.slug}`,
			(material) => latestDate([material]),
		);
		addPairedEntries(
			generalEntries,
			localizedPairs(
				series.filter((item) => item.status === 'published'),
				'seriesId',
			),
			locale,
			(item) => `/${item.locale}/series/${item.slug}`,
			(item) => latestDate([item]),
		);

		const questionEntities = entities
			.filter(
				(entity) =>
					entity.locale === locale &&
					entity.kind === 'question' &&
					entity.status === 'published' &&
					publicQuestionIds.has(entity.id),
			)
			.toSorted((left, right) => left.id.localeCompare(right.id));
		if (questionEntities.length !== publicQuestions.length) {
			throw new Error(
				`${locale} question sitemap has ${questionEntities.length} entities for ${publicQuestions.length} public questions.`,
			);
		}
		for (const entity of questionEntities) {
			if ((entity.materialIds?.length ?? 0) + (entity.pageIds?.length ?? 0) === 0) {
				throw new Error(`Question ${entity.id} has no public material or page association.`);
			}
		}
		const questionEntries = questionEntities.map((entity) => ({
			path: questionPath(locale, entity.id),
			alternates: {
				uk: questionPath('uk', entity.id),
				en: questionPath('en', entity.id),
			},
			lastmod: releaseDate,
		}));

		const paths = generalEntries.map((entry) => entry.path);
		if (new Set(paths).size !== paths.length) {
			throw new Error(`${locale} general sitemap contains duplicate URLs.`);
		}

		artifacts.set(`public/sitemaps/${locale}/site.xml`, renderUrlSet(generalEntries, origin));
		artifacts.set(`public/sitemaps/${locale}/questions.xml`, renderUrlSet(questionEntries, origin));
	}

	artifacts.set('public/sitemap.xml', renderSitemapIndex(origin, releaseDate));
	return artifacts;
}

async function main() {
	const mode = process.argv[2] ?? '--check';
	const artifacts = await buildSitemapArtifacts();
	if (mode === '--write') {
		for (const [relativePath, expected] of artifacts) {
			await mkdir(path.dirname(path.join(projectRoot, relativePath)), { recursive: true });
			await writeFile(path.join(projectRoot, relativePath), expected);
		}
		console.log(`Generated ${artifacts.size - 1} localized sitemaps and sitemap.xml.`);
		return;
	}
	if (mode === '--check') {
		for (const [relativePath, expected] of artifacts) {
			let actual;
			try {
				actual = await readFile(path.join(projectRoot, relativePath), 'utf8');
			} catch {
				throw new Error(`${relativePath} is missing. Run npm run sitemaps:build.`);
			}
			if (actual !== expected) {
				throw new Error(`${relativePath} has drifted. Run npm run sitemaps:build.`);
			}
		}
		console.log('Sitemaps match the released public question index and routes.');
		return;
	}
	throw new Error(`Unknown mode ${mode}. Use --write or --check.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	});
}
