import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createCompiledSiteDriver } from '../testing-interface/site-driver.mjs';

const withoutReactMarkers = (html) => html.replaceAll('<!-- -->', '');

test('ICW-HIST-0039: the compiled shell uses the monogram, dialogs, hymn, social block, and loader stanza', async () => {
	const site = await createCompiledSiteDriver();
	const response = await site.request('/en/');
	assert.equal(response.status, 200);
	const html = withoutReactMarkers(await response.text());

	assert.match(html, /This system will live/);
	assert.match(html, /data-brand-state="ic-monogram-2026"/);
	assert.match(html, /class="brand-mark brand-mark--header"/);
	assert.match(html, /class="brand-mark brand-mark--loader"/);
	assert.match(html, /class="brand-mark brand-mark--folder"/);
	assert.match(html, /I stand[\s\S]*When everything[\s\S]*Lies down\./);
	assert.match(html, /<dialog[^>]*class="site-modal"/);
	assert.match(html, /Welcome to IRON CREED/);
	assert.match(html, /class="social-links social-links--sidebar"/);
	assert.match(html, /class="social-links social-links--modal"/);
	assert.match(html, /class="theme-switcher"[\s\S]*class="anthem-toggle"/);
	assert.match(html, /aria-label="Play the anthem: IRON CREED"/);
	assert.match(html, /<audio[^>]*preload="none"/);
	assert.match(html, /https:\/\/cdn1\.suno\.ai\/21d23ef4-802c-47c2-a30d-2578decc08e1\.mp3/);
	assert.doesNotMatch(html, /autoplay/);
	assert.match(html, /href="https:\/\/t\.me\/\+6-ge0JXP25o4MTQy"/);
	assert.match(html, /href="https:\/\/github\.com\/IRONCREED"/);
	assert.match(html, /href="https:\/\/www\.linkedin\.com\/company\/IRONCREED"/);
	assert.doesNotMatch(html, /military medical-AI prototype/);
});

test('ICW-HIST-0039: Ada renders as twelve addressable chapters with adult notices', async () => {
	const site = await createCompiledSiteDriver();
	const [series, first, final, pattern] = await Promise.all([
		site.request('/en/series/do-not-be-afraid-sir-adas-machine-requiem'),
		site.request('/en/scenarios/do-not-be-afraid-sir'),
		site.request('/en/scenarios/do-not-be-afraid-sir-death-of-my-world'),
		site.request('/en/research/body-as-temporary-construction'),
	]);
	for (const response of [series, first, final, pattern]) assert.equal(response.status, 200);

	const seriesHtml = withoutReactMarkers(await series.text());
	assert.equal((seriesHtml.match(/data-catalog-id="material\./g) ?? []).length, 12);
	assert.match(seriesHtml, /Do Not Be Afraid, Sir: Ada’s Machine Requiem/);

	const firstHtml = withoutReactMarkers(await first.text());
	assert.match(firstHtml, />1\/12</);
	assert.match(firstHtml, /Age rating/);
	assert.match(firstHtml, /Age rating \/ 21\+/);
	assert.match(firstHtml, /graphic descriptions of violence/);
	assert.match(firstHtml, /rel="next"/);

	const finalHtml = withoutReactMarkers(await final.text());
	assert.match(finalHtml, />12\/12</);
	assert.match(finalHtml, /I will stay with you/);
	assert.doesNotMatch(finalHtml, /rel="next"/);

	const patternHtml = withoutReactMarkers(await pattern.text());
	assert.match(patternHtml, /Age rating \/ 16\+/);
	assert.match(patternHtml, /sexualised poses[\s\S]*coercion/i);
});

test('ICW-HIST-0039: the index and four maps reflect the expanded material and series routes', async () => {
	const site = await createCompiledSiteDriver();
	const [index, root, ukSite, enSite, ukQuestions, enQuestions] = await Promise.all([
		site.request('/en/pages/corpus-index'),
		site.request('/sitemap.xml'),
		site.request('/sitemaps/uk/site.xml'),
		site.request('/sitemaps/en/site.xml'),
		site.request('/sitemaps/uk/questions.xml'),
		site.request('/sitemaps/en/questions.xml'),
	]);
	for (const response of [index, root, ukSite, enSite, ukQuestions, enQuestions]) {
		assert.equal(response.status, 200);
	}

	assert.match(await index.text(), />578<\/small>/);
	assert.equal(((await root.text()).match(/<sitemap>/g) ?? []).length, 4);
	assert.equal(((await ukSite.text()).match(/<url>/g) ?? []).length, 35);
	assert.equal(((await enSite.text()).match(/<url>/g) ?? []).length, 35);
	assert.equal(((await ukQuestions.text()).match(/<url>/g) ?? []).length, 455);
	assert.equal(((await enQuestions.text()).match(/<url>/g) ?? []).length, 455);
});

test('ICW-HIST-0039: public brand SVGs embed the same raster master', async () => {
	const [brand, favicon] = await Promise.all([
		readFile(new URL('../../public/brand/iron-creed-mark.svg', import.meta.url), 'utf8'),
		readFile(new URL('../../public/favicon.svg', import.meta.url), 'utf8'),
	]);
	assert.match(brand, /data:image\/png;base64,/);
	assert.match(favicon, /data:image\/png;base64,/);
	assert.match(brand, /5d33da30f09726d44fe668d381320e8c41aee0ab3875560443aa9955a85eda5b/);
	assert.match(favicon, /5d33da30f09726d44fe668d381320e8c41aee0ab3875560443aa9955a85eda5b/);
});
