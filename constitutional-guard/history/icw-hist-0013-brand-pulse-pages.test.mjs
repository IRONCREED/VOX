import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompiledSiteDriver } from '../testing-interface/site-driver.mjs';

test('ICW-HIST-0013: published article HTML exposes the progressive brand and dialogue contract', async () => {
	const site = await createCompiledSiteDriver();
	const response = await site.request('/uk/research/vid-tila-do-syhnalu');

	assert.equal(response.status, 200);
	const html = await response.text();
	const headerStart = html.indexOf('class="system-header"');
	const headerEnd = html.indexOf('</header>', headerStart);
	assert.ok(headerStart >= 0 && headerEnd > headerStart);
	const header = html.slice(headerStart, headerEnd);

	const controlsPosition = header.indexOf('class="header-crest"');
	const identityPosition = header.indexOf('class="header-wordmark"');
	const reservedPosition = header.indexOf('class="header-reserved"');
	assert.ok(controlsPosition >= 0 && controlsPosition < identityPosition);
	assert.ok(identityPosition < reservedPosition);
	assert.match(header, /data-brand-motion="animated"/);
	assert.doesNotMatch(header, /class="pulse-line/);

	assert.match(html, /class="loading-gate[^"]*"[\s\S]*?data-brand-motion="animated"/);
	assert.match(html, /class="protocol-folder[^"]*"[\s\S]*?data-brand-motion="static"/);
	assert.match(html, /class="article-action article-action--discuss" href="#companion"/);
	assert.match(html, /class="companion-js-required" disabled=""/);
});
