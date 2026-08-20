import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompiledSiteDriver } from '../testing-interface/site-driver.mjs';

test('ICW-HIST-0019: the bilingual research and programming routes remain addressable', async () => {
	const site = await createCompiledSiteDriver();
	const [
		ukrainianHome,
		emptyCategory,
		researchCategory,
		ukrainianResearchArticle,
		englishResearchArticle,
		ukrainianCategory,
		englishCategory,
		ukrainianArticle,
		englishArticle,
		ukrainianFilter,
		englishApi,
		sitemap,
		legacyRoute,
	] = await Promise.all([
		site.request('/uk/'),
		site.request('/uk/games'),
		site.request('/uk/research'),
		site.request('/uk/research/vid-tila-do-syhnalu'),
		site.request('/en/research/from-body-to-signal'),
		site.request('/uk/programming'),
		site.request('/en/programming'),
		site.request('/uk/programming/navishcho-potribna-dokumentatsiia'),
		site.request('/en/programming/why-documentation-matters'),
		site.request('/uk/programming?tag=documentation'),
		site.request('/api/materials?locale=en&category=programming&tag=documentation&page=1'),
		site.request('/sitemap.xml'),
		site.request('/uk/documentation/navishcho-potribna-dokumentatsiia'),
	]);

	assert.equal(ukrainianHome.status, 200);
	const ukrainianHomeHtml = await ukrainianHome.text();
	assert.match(ukrainianHomeHtml, /Система, що досліджує наслідки/);
	for (const category of ['games', 'programming', 'research', 'scenarios']) {
		assert.match(ukrainianHomeHtml, new RegExp(`href=["']\\/uk\\/${category}["']`));
	}
	assert.match(ukrainianHomeHtml, /Від тіла до сигналу/);
	assert.match(ukrainianHomeHtml, /Навіщо потрібна документація/);

	assert.equal(emptyCategory.status, 200);
	const emptyCategoryHtml = await emptyCategory.text();
	assert.match(emptyCategoryHtml, /Твори, системи та рішення/);
	assert.match(emptyCategoryHtml, />00</);
	assert.doesNotMatch(emptyCategoryHtml, /class=["'][^"']*material-card/);

	assert.equal(researchCategory.status, 200);
	const researchCategoryHtml = await researchCategory.text();
	assert.match(researchCategoryHtml, /Від тіла до сигналу/);
	assert.doesNotMatch(researchCategoryHtml, /Конституція коду/);

	assert.equal(ukrainianResearchArticle.status, 200);
	const ukrainianResearchHtml = await ukrainianResearchArticle.text();
	assert.match(ukrainianResearchHtml, /Від тіла до сигналу/);
	assert.match(ukrainianResearchHtml, /Sam Starling/);
	assert.match(ukrainianResearchHtml, /Oksana Dubinetska/);
	assert.match(ukrainianResearchHtml, /Тіло: коли горор навчився інтерналізувати насильство/);
	assert.match(ukrainianResearchHtml, /<blockquote/i);
	assert.match(ukrainianResearchHtml, /https:\/\/zenodo\.org\/records\/20647570/);
	assert.match(ukrainianResearchHtml, /10\.5281\/zenodo\.20647570/);
	assert.match(ukrainianResearchHtml, /ШІ-компаньйону потрібен JavaScript/);
	assert.doesNotMatch(ukrainianResearchHtml, /class=["'][^"']*suggestion-list/);

	assert.equal(englishResearchArticle.status, 200);
	const englishResearchHtml = await englishResearchArticle.text();
	assert.match(englishResearchHtml, /From Body to Signal/);
	assert.match(englishResearchHtml, /The Body: When Horror Learned to Internalise Violence/);
	assert.match(englishResearchHtml, /hreflang=["']uk["']/i);
	assert.match(englishResearchHtml, /application\/ld\+json/i);

	assert.equal(ukrainianCategory.status, 200);
	const ukrainianCategoryHtml = await ukrainianCategory.text();
	assert.match(ukrainianCategoryHtml, /Навіщо потрібна документація/);
	assert.match(ukrainianCategoryHtml, />01</);

	assert.equal(englishCategory.status, 200);
	assert.match(await englishCategory.text(), /Why Documentation Matters/);

	assert.equal(ukrainianArticle.status, 200);
	const ukrainianHtml = await ukrainianArticle.text();
	assert.match(ukrainianHtml, /як рішення переживає автора/);
	assert.match(ukrainianHtml, /Sam Starling/);
	assert.match(ukrainianHtml, /Oksana Dubinetska/);
	assert.match(ukrainianHtml, /The Los Alamos Primer/);
	assert.match(ukrainianHtml, /<pre[^>]*data-language="ts"[^>]*><code>/);
	assert.match(ukrainianHtml, /failedAttempts &gt;= 5/);
	assert.match(ukrainianHtml, /10\.5281\/zenodo\.20608559/);
	assert.match(ukrainianHtml, /01-Literate-Programming-EN\.pdf/);
	assert.match(ukrainianHtml, /href="\/en\/programming\/why-documentation-matters"/);

	assert.equal(englishArticle.status, 200);
	const englishHtml = await englishArticle.text();
	assert.match(englishHtml, /How a Decision Outlives Its Author/);
	assert.match(englishHtml, /Knuth changes the program/);
	assert.match(englishHtml, /data-language="text"/);
	assert.match(englishHtml, /hreflang="uk"/i);
	assert.match(englishHtml, /application\/ld\+json/i);

	assert.equal(ukrainianFilter.status, 200);
	const filterHtml = await ukrainianFilter.text();
	assert.match(filterHtml, /href="\/uk\/programming\?tag=documentation"[^>]*aria-current="page"/);
	assert.match(filterHtml, /Навіщо потрібна документація/);

	assert.equal(englishApi.status, 200);
	const payload = await englishApi.json();
	assert.equal(payload.totalItems, 1);
	assert.equal(payload.items.length, 1);
	assert.equal(payload.items[0].category, 'programming');
	assert.ok(payload.items[0].tags.includes('documentation'));

	assert.equal(sitemap.status, 200);
	const sitemapText = await sitemap.text();
	assert.match(sitemapText, /\/uk\/programming\/navishcho-potribna-dokumentatsiia/);
	assert.match(sitemapText, /\/en\/programming\/why-documentation-matters/);
	assert.match(sitemapText, /\/uk\/research\/vid-tila-do-syhnalu/);
	assert.match(sitemapText, /\/en\/research\/from-body-to-signal/);
	assert.doesNotMatch(sitemapText, /\/uk\/documentation\/navishcho-potribna-dokumentatsiia/);

	assert.equal(legacyRoute.status, 404);
});
