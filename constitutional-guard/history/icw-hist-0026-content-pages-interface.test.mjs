import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompiledSiteDriver } from '../testing-interface/site-driver.mjs';

test('ICW-HIST-0026: the build links to VOX and the corpus index is a content page', async () => {
	const site = await createCompiledSiteDriver();
	const [home, index, sitemap, robots] = await Promise.all([
		site.request('/en/'),
		site.request('/en/pages/corpus-index'),
		site.request('/sitemap.xml'),
		site.request('/robots.txt'),
	]);

	assert.equal(home.status, 200);
	const homeHtml = await home.text();
	assert.match(homeHtml, /Life as a Function/);
	assert.match(homeHtml, /href="https:\/\/github\.com\/IRONCREED\/VOX"/);
	assert.match(homeHtml, /href="\/en\/pages\/corpus-index"/);
	assert.match(homeHtml, /Lady Hague/);
	assert.doesNotMatch(homeHtml, /aria-label="Entity kind"/);

	assert.equal(index.status, 200);
	const indexHtml = await index.text();
	assert.match(indexHtml, /aria-label="Entity kind"/);
	assert.match(indexHtml, /value="page"/);
	assert.match(indexHtml, />118<\/small>/);
	assert.match(indexHtml, /page\.about/);

	assert.equal(sitemap.status, 404);
	assert.equal(robots.status, 200);
	assert.doesNotMatch(await robots.text(), /sitemap/i);
});

test('ICW-HIST-0026: about, policies, permanent DOI, ORCID, and underscore emphasis render', async () => {
	const site = await createCompiledSiteDriver();
	const [about, terms, privacy, ai, licensing, research, programming] = await Promise.all([
		site.request('/en/pages/about'),
		site.request('/en/pages/terms-of-use'),
		site.request('/en/pages/privacy-policy'),
		site.request('/en/pages/ai-policy'),
		site.request('/en/pages/licensing'),
		site.request('/en/research/from-body-to-signal'),
		site.request('/en/programming/why-documentation-matters'),
	]);

	for (const response of [about, terms, privacy, ai, licensing, research, programming]) {
		assert.equal(response.status, 200);
	}
	const aboutHtml = await about.text();
	assert.match(aboutHtml, /military medical-AI prototype/);
	assert.match(aboutHtml, /AI companion/);

	const policyHtml = await Promise.all([terms.text(), privacy.text(), ai.text(), licensing.text()]);
	for (const html of policyHtml) {
		for (const slug of ['terms-of-use', 'privacy-policy', 'ai-policy', 'licensing']) {
			assert.match(html, new RegExp(`href="/en/pages/${slug}"`));
		}
	}

	const licensingHtml = policyHtml[3];
	assert.match(licensingHtml, /<table>/);
	assert.match(licensingHtml, /CC BY-SA 4\.0/);

	const researchHtml = await research.text();
	const programmingHtml = await programming.text();
	assert.match(researchHtml, /href="https:\/\/doi\.org\/10\.5281\/zenodo\.19773963"/);
	assert.match(programmingHtml, /href="https:\/\/doi\.org\/10\.5281\/zenodo\.20608558"/);
	assert.match(researchHtml, /href="https:\/\/orcid\.org\/0009-0009-2621-6372"/);
	assert.match(researchHtml, /href="https:\/\/orcid\.org\/0009-0003-8777-8412"/);
	assert.match(
		researchHtml,
		/<em>Language as Infection: Media Communication as a Mechanism of Harm<\/em>/,
	);
});
