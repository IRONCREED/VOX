import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompiledSiteDriver } from '../testing-interface/site-driver.mjs';

const count = (html, pattern) => (html.match(pattern) ?? []).length;

test('ICW-HIST-0067: both About locales expose the open identity and complete no-JS practice map fallback', async () => {
	const site = await createCompiledSiteDriver();
	const [ukResponse, enResponse] = await Promise.all([
		site.request('/uk/pages/about'),
		site.request('/en/pages/about'),
	]);
	assert.equal(ukResponse.status, 200);
	assert.equal(enResponse.status, 200);

	const uk = await ukResponse.text();
	const en = await enResponse.text();
	for (const html of [uk, en]) {
		assert.doesNotMatch(html, /about-iron-creed-identity/);
		const intro = /class="content-page-header__identity">([\s\S]*?)<\/div><\/div>/.exec(html)?.[1];
		assert.ok(intro);
		assert.equal(count(intro, /<p>/g), 3);
		assert.match(intro, /href="https:\/\/zhovten.games\/"/);
		assert.match(html, /href="#team-profiles"/);
		assert.match(html, /<section id="team-profiles" tabindex="-1"/);
		assert.equal(count(html, /class="practice-project"/g), 46);
		assert.equal(count(html, /class="practice-project__review"/g), 19);
		assert.equal(count(html, /class="practice-map__marker"/g), 7);
		assert.match(html, /id="practice-project-quokka-consulting"/);
		assert.match(html, /id="practice-project-ironcreed-request-log"/);
		assert.doesNotMatch(html, /rocketslides/);
		assert.doesNotMatch(html, /IRON CREED|Russia|(?<!\p{L})РФ(?!\p{L})|росій|росси/iu);
	}
	assert.match(uk, />IRONCREED<\/strong>/);
	assert.match(en, /I hired Semen for a project for my client/);
	assert.match(en, /minimal compliance with the requirements/);
	assert.match(en, /Thank you\. The work is done/);
	assert.match(en, /Sam Starling/);
	assert.doesNotMatch(en, /Ruslan|Руслан|Pan Canon/);
	assert.doesNotMatch(en, /href="https:\/\/freelancehunt\.com[^" ]*#reviews/);
	assert.match(en, /original reviews on specific platforms are available on request/);
	assert.match(uk, /Негативних відгуків у нас немає/);
	assert.equal(count(en, /class="about-card-slider"/g), 0);
	assert.equal(count(en, /class="about-card-slider__slide"/g), 0);
	assert.doesNotMatch(en, /about-card-slider__controls/);
	assert.doesNotMatch(en, /aria-roledescription="carousel"/);
	assert.doesNotMatch(en, /header-reserved/);
});

test('ICW-HIST-0067: article and diagram projections remain complete after layout repair', async () => {
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
