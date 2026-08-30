import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { createCompiledSiteDriver } from '../../../testing-interface/site-driver.mjs';

const projectRoot = process.env.IRON_WARDEN_PROJECT_ROOT;

test('the public build renders the service story and real WARDEN route', async () => {
	const site = await createCompiledSiteDriver();
	const response = await site.request('/en/pages/about');
	assert.equal(response.status, 200);
	const html = await response.text();

	assert.match(html, /So, what do we actually do\?/);
	assert.match(html, /From a studio idea to a verifiable publication/);
	assert.match(html, /DevOps as a way of working/);
	assert.match(html, /Turning company data into working context for LLMs/);
	assert.match(html, /WARDEN — an independent project verification boundary/);
	assert.match(
		html,
		/href="https:\/\/github\.com\/IRONCREED\/VOX\/tree\/main\/constitutional-guard"/,
	);
	assert.match(html, /The library of verified public case studies is being prepared/);
	assert.match(html, /Testimonials will be published after client approval/);
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
