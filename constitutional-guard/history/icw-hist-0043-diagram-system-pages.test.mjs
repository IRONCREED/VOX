import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompiledSiteDriver } from '../testing-interface/site-driver.mjs';

test('editorial graphic slots are ready for diagrams without inventing diagrams', async () => {
	const site = await createCompiledSiteDriver();
	const response = await site.request('/en/programming/why-documentation-matters');
	assert.equal(response.status, 200);
	const html = await response.text();
	assert.match(html, /class="diagram-brief"/);
	assert.match(html, /data-asset-id="asset\.why-documentation\.g01"/);
	assert.match(html, /Graphic slot G01/);
	assert.doesNotMatch(html, /class="ic-diagram"/);
});
