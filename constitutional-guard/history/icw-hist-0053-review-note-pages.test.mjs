import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompiledSiteDriver } from '../testing-interface/site-driver.mjs';

const count = (html, pattern) => (html.match(pattern) ?? []).length;

test('ICW-HIST-0053: both About locales expose the inline identity and complete no-JS card fallback', async () => {
	const site = await createCompiledSiteDriver();
	const [ukResponse, enResponse] = await Promise.all([
		site.request('/uk/pages/about'),
		site.request('/en/pages/about'),
	]);
	assert.equal(ukResponse.status, 200);
	assert.equal(enResponse.status, 200);

	const uk = await ukResponse.text();
	const en = await enResponse.text();
	assert.match(uk, /contextual-hint--inline/);
	assert.match(uk, />IRON CREED<\/strong>/);
	assert.match(uk, /студії.*Zhovten Games/);
	assert.match(en, /I hired Semen for a project for my client/);
	assert.match(en, /minimal compliance with the requirements/);
	assert.match(en, /Thank you\. The work is done/);
	assert.match(en, /Sam Starling/);
	assert.doesNotMatch(en, /Ruslan|Руслан|Pan Canon/);
	assert.doesNotMatch(en, /href="https:\/\/freelancehunt\.com/);
	assert.match(en, /original reviews on specific platforms are available on request/);
	assert.match(uk, /Негативних відгуків у нас немає/);
	assert.equal(count(en, /class="about-card-slider"/g), 2);
	assert.equal(count(en, /class="about-card-slider__slide"/g), 24);
	assert.doesNotMatch(en, /about-card-slider__controls/);
	assert.doesNotMatch(en, /aria-roledescription="carousel"/);
	assert.doesNotMatch(en, /header-reserved/);
});

test('ICW-HIST-0053: article and diagram projections remain complete after layout repair', async () => {
	const site = await createCompiledSiteDriver();
	const [adaResponse, documentationResponse, articleOneResponse] = await Promise.all([
		site.request('/en/scenarios/do-not-be-afraid-sir-mechanist'),
		site.request('/en/programming/why-documentation-matters'),
		site.request('/en/research/write-america-how-article-i-turns-intent-into-general-law'),
	]);
	for (const response of [adaResponse, documentationResponse, articleOneResponse]) {
		assert.equal(response.status, 200);
	}

	const ada = await adaResponse.text();
	assert.match(ada, /article-document article-document--scenario-log/);
	assert.match(ada, /2\. MECHANIST/);
	assert.match(ada, /article-series-navigation/);
	assert.equal(count(await documentationResponse.text(), /class="ic-diagram"/g), 4);
	const articleOne = await articleOneResponse.text();
	assert.equal(count(articleOne, /class="ic-diagram"/g), 8);
	assert.match(articleOne, /role="table"/);
});
