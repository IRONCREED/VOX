import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompiledSiteDriver } from '../testing-interface/site-driver.mjs';

const diagramCount = (html) => (html.match(/class="ic-diagram"/g) ?? []).length;

async function readPage(site, pathname) {
	const response = await site.request(pathname);
	assert.equal(response.status, 200, pathname);
	return response.text();
}

test('all four documentation diagrams replace their indexed editorial slots', async () => {
	const site = await createCompiledSiteDriver();
	const html = await readPage(site, '/en/programming/why-documentation-matters');
	assert.equal(diagramCount(html), 4);
	assert.doesNotMatch(html, /class="diagram-brief"/);
	assert.match(html, /data-asset-id="asset\.why-documentation\.g01"/);
	assert.match(html, /data-asset-id="asset\.why-documentation\.g04"/);
	assert.match(html, /ic-diagram-transcript/);
});

test('body-to-signal and inline Constitution slots render their complete projections', async () => {
	const site = await createCompiledSiteDriver();
	const body = await readPage(site, '/en/research/from-body-to-signal');
	const articleSeven = await readPage(
		site,
		'/en/research/connect-america-how-article-vii-bootstraps-a-republic',
	);
	const articleOne = await readPage(
		site,
		'/en/research/write-america-how-article-i-turns-intent-into-general-law',
	);

	assert.equal(diagramCount(body), 6);
	assert.equal(diagramCount(articleSeven), 5);
	assert.equal(diagramCount(articleOne), 8);
	assert.match(articleOne, /data-asset-id="asset\.constitution-runtime-07-article-i\.g06"/);
	assert.match(articleOne, /role="table"/);
	assert.match(articleOne, /role="columnheader"/);
	assert.match(articleOne, /role="rowheader"/);
});
