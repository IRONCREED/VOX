import assert from 'node:assert/strict';
import test from 'node:test';

test('renders the released production metadata and local shell assets', async () => {
	const workerUrl = new URL('../dist/server/index.js', import.meta.url);
	workerUrl.searchParams.set('test', `${process.pid}-${Date.now()}`);
	const { default: worker } = await import(workerUrl.href);

	const response = await worker.fetch(
		new Request('http://localhost/uk/', {
			headers: { accept: 'text/html' },
		}),
		{
			ASSETS: {
				fetch: async () => new Response('Not found', { status: 404 }),
			},
		},
		{
			waitUntil() {},
			passThroughOnException() {},
		},
	);

	assert.equal(response.status, 200);
	assert.match(response.headers.get('content-type') ?? '', /^text\/html\b/i);
	const html = await response.text();
	assert.match(html, /<title>IRON CREED — Ця система житиме<\/title>/);
	assert.match(html, /<meta[^>]*name="robots"[^>]*content="follow, index"/);
	assert.match(
		html,
		/<link[^>]*rel="canonical"[^>]*href="https:\/\/ironcreed-credo\.ironcreed\.chatgpt\.site\/uk\/"/,
	);
	assert.match(html, /src="\/brand\/iron-creed-mark\.svg"/);
	assert.match(html, /src="\/audio\/iron-creed-anthem\.m4a"/);
	assert.doesNotMatch(html, /name=["']codex-preview["']/i);
	assert.doesNotMatch(html, /cdn1\.suno\.ai/);
});
