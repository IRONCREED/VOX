import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompiledSiteDriver } from '../testing-interface/site-driver.mjs';

test('ICW-HIST-0011: the bilingual research publication and empty categories remain addressable', async () => {
	const site = await createCompiledSiteDriver();

	const ukrainianHome = await site.request('/uk/');
	assert.equal(ukrainianHome.status, 200);
	const ukrainianHomeHtml = await ukrainianHome.text();
	assert.match(ukrainianHomeHtml, /Система, що досліджує наслідки/);
	for (const category of ['games', 'programming', 'research', 'scenarios']) {
		assert.match(ukrainianHomeHtml, new RegExp(`href=["']\\/uk\\/${category}["']`));
	}
	assert.match(ukrainianHomeHtml, /Від тіла до сигналу/);

	const emptyCategory = await site.request('/uk/games');
	assert.equal(emptyCategory.status, 200);
	const emptyCategoryHtml = await emptyCategory.text();
	assert.match(emptyCategoryHtml, /Твори, системи та рішення/);
	assert.match(emptyCategoryHtml, />00</);
	assert.doesNotMatch(emptyCategoryHtml, /class=["'][^"']*material-card/);

	const researchCategory = await site.request('/uk/research');
	assert.equal(researchCategory.status, 200);
	const researchCategoryHtml = await researchCategory.text();
	assert.match(researchCategoryHtml, /Від тіла до сигналу/);
	assert.doesNotMatch(researchCategoryHtml, /Конституція коду/);

	const ukrainianArticle = await site.request('/uk/research/vid-tila-do-syhnalu');
	assert.equal(ukrainianArticle.status, 200);
	const ukrainianArticleHtml = await ukrainianArticle.text();
	assert.match(ukrainianArticleHtml, /Від тіла до сигналу/);
	assert.match(ukrainianArticleHtml, /Sam Starling/);
	assert.match(ukrainianArticleHtml, /Oksana Dubinetska/);
	assert.match(ukrainianArticleHtml, /Тіло: коли горор навчився інтерналізувати насильство/);
	assert.match(ukrainianArticleHtml, /<blockquote/i);
	assert.match(ukrainianArticleHtml, /https:\/\/zenodo\.org\/records\/20647570/);
	assert.match(ukrainianArticleHtml, /10\.5281\/zenodo\.20647570/);
	assert.match(ukrainianArticleHtml, /ШІ-компаньйону потрібен JavaScript/);
	assert.doesNotMatch(ukrainianArticleHtml, /class=["'][^"']*suggestion-list/);

	const englishArticle = await site.request('/en/research/from-body-to-signal');
	assert.equal(englishArticle.status, 200);
	const englishArticleHtml = await englishArticle.text();
	assert.match(englishArticleHtml, /From Body to Signal/);
	assert.match(englishArticleHtml, /The Body: When Horror Learned to Internalise Violence/);
	assert.match(englishArticleHtml, /hreflang=["']uk["']/i);
	assert.match(englishArticleHtml, /application\/ld\+json/i);

	const removedArticle = await site.request('/uk/documentation/navishcho-potribna-dokumentatsiia');
	assert.equal(removedArticle.status, 404);

	const sitemap = await site.request('/sitemap.xml');
	assert.equal(sitemap.status, 200);
	const sitemapText = await sitemap.text();
	assert.match(sitemapText, /\/uk\/research\/vid-tila-do-syhnalu/);
	assert.match(sitemapText, /\/en\/research\/from-body-to-signal/);
	assert.doesNotMatch(sitemapText, /navishcho-potribna-dokumentatsiia/);
});
