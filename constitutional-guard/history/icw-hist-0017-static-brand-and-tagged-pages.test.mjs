import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompiledSiteDriver } from '../testing-interface/site-driver.mjs';

test('ICW-HIST-0017: rendered pages expose the static mark, favicon, and one-tag selection', async () => {
	const site = await createCompiledSiteDriver();
	const [articleResponse, categoryResponse, apiResponse, manifestResponse] = await Promise.all([
		site.request('/uk/research/vid-tila-do-syhnalu'),
		site.request('/uk/research?tag=war'),
		site.request('/api/materials?locale=uk&category=research&tag=war&page=1'),
		site.request('/manifest.webmanifest'),
	]);

	assert.equal(articleResponse.status, 200);
	const articleHtml = await articleResponse.text();
	const headerStart = articleHtml.indexOf('class="system-header"');
	const headerEnd = articleHtml.indexOf('</header>', headerStart);
	assert.ok(headerStart >= 0 && headerEnd > headerStart);
	const header = articleHtml.slice(headerStart, headerEnd);
	assert.match(header, /data-brand-state="peak"/);
	assert.match(header, /class="brand-mark brand-mark--header"/);
	assert.doesNotMatch(header, /data-brand-motion|data-brand-frame/);
	assert.match(articleHtml, /class="loading-gate[^"]*"[\s\S]*?brand-mark--loader/);
	assert.match(articleHtml, /class="protocol-folder[^"]*"[\s\S]*?brand-mark--folder/);
	assert.match(articleHtml, /href="(?:https:\/\/[^\"]+)?\/favicon\.svg"/);
	assert.match(articleHtml, /href="\/uk\/research\?tag=war"/);

	assert.equal(categoryResponse.status, 200);
	const categoryHtml = await categoryResponse.text();
	assert.match(categoryHtml, /aria-label="Відібрати за тегом"/);
	assert.match(categoryHtml, /href="\/uk\/research\?tag=war"/);
	assert.match(categoryHtml, /aria-current="page"/);
	assert.match(categoryHtml, /href="\/en\/research\?tag=war"/);
	assert.match(categoryHtml, /Від тіла до сигналу/);

	assert.equal(apiResponse.status, 200);
	const payload = await apiResponse.json();
	assert.equal(payload.totalItems, 1);
	assert.equal(payload.items.length, 1);
	assert.ok(payload.items[0].tags.includes('war'));

	assert.equal(manifestResponse.status, 200);
	const manifest = await manifestResponse.json();
	assert.ok(manifest.icons.every((icon) => icon.src === '/favicon.svg'));
});
