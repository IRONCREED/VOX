import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompiledSiteDriver } from '../testing-interface/site-driver.mjs';

test('ICW-HIST-0004: private publication exposes PWA and SEO infrastructure without indexing', async () => {
	const site = await createCompiledSiteDriver();

	const robots = await site.request('/robots.txt');
	assert.equal(robots.status, 200);
	const robotsText = await robots.text();
	assert.match(robotsText, /Disallow:\s*\//i);
	assert.match(robotsText, /sitemap\.xml/i);

	const sitemap = await site.request('/sitemap.xml');
	assert.equal(sitemap.status, 200);
	const sitemapText = await sitemap.text();
	assert.match(sitemapText, /\/uk\/documentation\/navishcho-potribna-dokumentatsiia/);
	assert.match(sitemapText, /\/en\/documentation\/why-documentation-matters/);
	assert.match(sitemapText, /hreflang=["']uk["']/i);
	assert.match(sitemapText, /hreflang=["']en["']/i);

	const manifest = await site.request('/manifest.webmanifest');
	assert.equal(manifest.status, 200);
	const manifestData = await manifest.json();
	assert.equal(manifestData.name, 'IRON CREED');
	assert.equal(manifestData.display, 'standalone');
	assert.equal(manifestData.start_url, '/uk/');
	assert.ok(manifestData.icons.some((icon) => icon.src === '/brand/iron-creed-mark.svg'));
});
