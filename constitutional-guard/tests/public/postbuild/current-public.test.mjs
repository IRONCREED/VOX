import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { createCompiledSiteDriver } from '../../../testing-interface/site-driver.mjs';

const projectRoot = process.env.IRON_WARDEN_PROJECT_ROOT;

test('the public build renders the service story, attributed portfolio, and real WARDEN route', async () => {
	const site = await createCompiledSiteDriver();
	const response = await site.request('/en/pages/about');
	assert.equal(response.status, 200);
	const html = await response.text();

	assert.match(html, /Who is IRON CREED\?/);
	assert.match(html, /IRON CREED — the personified engineering process of Zhovten Games/);
	assert.match(html, /href="\/en\/pages\/material-cycle"/);
	assert.match(html, /href="\/en\/pages\/anthem"/);
	assert.doesNotMatch(html, /class="about-cycle"/);
	const cycle = await site.request('/en/pages/material-cycle');
	assert.equal(cycle.status, 200);
	assert.match(await cycle.text(), /From a working question to a verifiable publication/);
	assert.match(html, /DevOps as a way of working/);
	assert.match(html, /Turning company data into working context for LLMs/);
	assert.match(html, /WARDEN — an independent project verification boundary/);
	assert.match(
		html,
		/href="https:\/\/github\.com\/IRONCREED\/VOX\/tree\/main\/constitutional-guard"/,
	);
	assert.match(html, /EMBO Studio · long-term infrastructure support/);
	assert.match(html, /Academic typesetting → an in-house publishing pipeline/);
	assert.match(html, /Shifton, Zipy, and 200\+ high-density cases/);
	assert.match(html, /Public team profiles/);
	assert.match(html, /href="https:\/\/www\.linkedin\.com\/company\/IRONCREED"/);
	assert.doesNotMatch(html, /Project type|Problem description/);
	assert.match(html, /reviews from all platforms/);
	assert.match(html, /available on request/);
	assert.doesNotMatch(html, /href="https:\/\/freelancehunt\.com/);
	assert.doesNotMatch(html, />link</i);
});

test('the public build renders the faceted monogram and local anthem only', async () => {
	const site = await createCompiledSiteDriver();
	const [home, privacy] = await Promise.all([
		site.request('/en/'),
		site.request('/en/pages/privacy-policy'),
	]);
	assert.equal(home.status, 200);
	assert.equal(privacy.status, 200);
	const homeHtml = await home.text();
	const privacyHtml = await privacy.text();

	assert.match(homeHtml, /data-brand-state="ic-faceted-monogram-2026"/);
	assert.match(homeHtml, /src="\/brand\/iron-creed-mark\.svg"/);
	assert.match(homeHtml, /src="\/audio\/iron-creed-anthem\.m4a"/);
	assert.doesNotMatch(homeHtml, /cdn1\.suno\.ai/);
	assert.match(privacyHtml, /same-origin site asset/);
	assert.doesNotMatch(privacyHtml, /requests[\s\S]*directly from Suno/i);

	await access(path.join(projectRoot, 'dist/client/audio/iron-creed-anthem.m4a'));
});
