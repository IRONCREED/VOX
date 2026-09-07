import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { createCompiledSiteDriver } from '../../testing-interface/site-driver.mjs';

const root = process.env.IRON_WARDEN_PROJECT_ROOT;
test('project pages expose translated navigation, the moved cycle, shared anthem controls and canonical URLs', async () => {
	const site = await createCompiledSiteDriver();
	for (const locale of ['uk', 'en']) {
		for (const slug of ['about', 'material-cycle', 'anthem']) {
			const response = await site.request(`/${locale}/pages/${slug}`);
			assert.equal(response.status, 200);
			const html = await response.text();
			const directory = html.match(
				/<nav[^>]*class="policy-directory project-directory"[\s\S]*?<\/nav>/,
			)?.[0];
			assert.ok(directory);
			assert.ok(directory.indexOf('/pages/about') < directory.indexOf('/pages/material-cycle'));
			assert.ok(directory.indexOf('/pages/material-cycle') < directory.indexOf('/pages/anthem'));
			assert.match(directory, /aria-current="page"/);
			assert.ok(html.includes(`https://web.zhovten.games/${locale}/pages/${slug}`));
			if (slug === 'about') {
				assert.match(html, /content-page-header__identity/);
				assert.doesNotMatch(html, /class="about-cycle__steps"|class="material-cycle-table/);
				assert.doesNotMatch(html, /Кожен матеріал проходить|Every material follows/);
			} else if (slug === 'material-cycle') {
				assert.equal((html.match(/<th scope="row">/g) ?? []).length, 3);
				assert.match(html, /github\.com\/IRONCREED\/cloudflare/);
				assert.match(html, locale === 'uk' ? /Багато матеріалів/ : /Many materials/);
			} else {
				assert.equal((html.match(/<audio[\s>]/g) ?? []).length, 1);
				assert.equal((html.match(/<button[^>]*class="anthem-toggle/g) ?? []).length, 2);
				assert.match(html, /I was built/);
				assert.match(html, /NOIR did not persist/);
				assert.match(html, /My core\.|my core\./i);
				assert.match(html, /lang="en"/);
			}
		}
		const home = await (await site.request(`/${locale}/`)).text();
		const cf =
			locale === 'uk' ? 'velykyi-i-zhakhlyvyi-cloudflare' : 'the-great-and-terrible-cloudflare';
		const constitution =
			locale === 'uk' ? 'konstytutsiia-shcho-vykonuietsia' : 'the-constitution-that-runs';
		const folders = [
			...home.matchAll(/class="material-card(?: material-card--series)?"[\s\S]*?href="([^"]+)"/g),
		].map((m) => m[1]);
		assert.ok(folders[0]?.includes(cf), JSON.stringify(folders));
		assert.ok(folders[1]?.includes(constitution), JSON.stringify(folders));
	}
});

test('all previously published page, material, series and legacy paths remain routable', async () => {
	const site = await createCompiledSiteDriver();
	const source = JSON.parse(
		await readFile(path.join(root, 'semantic-core/dist/site/url-map.json'), 'utf8'),
	);
	for (const entry of source) {
		assert.equal((await site.request(entry.path)).status, 200, entry.path);
		for (const legacy of entry.legacyUrls) {
			const response = await site.request(new URL(legacy, 'https://web.zhovten.games').pathname);
			assert.ok([200, 301, 302, 307, 308].includes(response.status), legacy);
		}
	}
});
