import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompiledSiteDriver } from '../testing-interface/site-driver.mjs';

test('ICW-HIST-0015: rendered pages expose six animated frames and the static peak', async () => {
	const site = await createCompiledSiteDriver();
	const response = await site.request('/uk/research/vid-tila-do-syhnalu');

	assert.equal(response.status, 200);
	const html = await response.text();
	const headerStart = html.indexOf('class="system-header"');
	const headerEnd = html.indexOf('</header>', headerStart);
	assert.ok(headerStart >= 0 && headerEnd > headerStart);
	const header = html.slice(headerStart, headerEnd);

	assert.match(header, /viewBox="0 0 128 158"/);
	assert.match(header, /data-brand-motion="animated"/);
	assert.match(header, /data-brand-frame-count="6"/);
	for (const frame of ['start', 'rise', 'peak', 'fall', 'fade', 'rest']) {
		assert.match(header, new RegExp(`data-brand-frame="${frame}"`));
	}

	assert.match(
		html,
		/class="loading-gate[^\"]*"[\s\S]*?data-brand-motion="animated"[\s\S]*?data-brand-frame-count="6"/,
	);
	assert.match(
		html,
		/class="protocol-folder[^\"]*"[\s\S]*?data-brand-motion="static"[\s\S]*?data-brand-frame="peak"/,
	);
});
