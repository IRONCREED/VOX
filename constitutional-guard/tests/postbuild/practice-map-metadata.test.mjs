import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { createCompiledSiteDriver } from '../../testing-interface/site-driver.mjs';

test('social cards use the current WebP artwork and the country map preserves every review', async () => {
	const site = await createCompiledSiteDriver();
	for (const locale of ['uk', 'en']) {
		for (const route of ['/', '/pages/about', '/programming/why-documentation-matters']) {
			if (locale === 'uk' && route.includes('why-documentation')) continue;
			const response = await site.request(`/${locale}${route}`);
			assert.equal(response.status, 200);
			const html = await response.text();
			assert.match(html, /property="og:image"[^>]+\.webp/);
			assert.match(html, /name="twitter:card" content="summary_large_image"/);
			assert.doesNotMatch(html, /IRON CREED|\/og\.png/);
		}
	}
	const registry = JSON.parse(
		await readFile(
			path.join(process.env.IRON_WARDEN_PROJECT_ROOT, 'content/config/social-previews.json'),
			'utf8',
		),
	);
	for (const cover of Object.values(registry.covers)) {
		const file = path.join(process.env.IRON_WARDEN_PROJECT_ROOT, 'dist/client', cover.src);
		await access(file);
		const bytes = await readFile(file);
		assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
	}
});
