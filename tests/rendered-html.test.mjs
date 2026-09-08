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
	assert.match(html, /<link[^>]*rel="canonical"[^>]*href="https:\/\/web\.zhovten\.games\/uk\/"/);
	assert.match(html, /src="\/brand\/iron-creed-mark\.svg"/);
	assert.match(html, /src="\/audio\/iron-creed-anthem\.m4a"/);
	assert.doesNotMatch(html, /name=["']codex-preview["']/i);
	assert.doesNotMatch(html, /cdn1\.suno\.ai/);

	const bodyClose = html.lastIndexOf('</body>');
	const htmlClose = html.lastIndexOf('</html>');
	assert.ok(bodyClose >= 0, 'the rendered document must close its body');
	assert.ok(htmlClose > bodyClose, 'the rendered document must close html after body');
	assert.equal(html.slice(htmlClose + '</html>'.length).trim(), '', 'nothing may follow </html>');
	for (const script of html.matchAll(/<script\b[\s\S]*?<\/script>/gi)) {
		assert.ok(
			(script.index ?? Number.POSITIVE_INFINITY) < bodyClose,
			'a rendered script must stay inside <body>',
		);
	}
});

test('project pages preserve welcome links, directory routes and the no-JavaScript companion fallback', async () => {
	const { default: worker } = await import('../dist/server/index.js');
	for (const locale of ['uk', 'en']) {
		for (const slug of ['about', 'material-cycle', 'anthem']) {
			const response = await worker.fetch(
				new Request(`http://localhost/${locale}/pages/${slug}`),
				{ ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } },
				{ waitUntil() {}, passThroughOnException() {} },
			);
			assert.equal(response.status, 200);
			const html = await response.text();
			const welcome = /<dialog[^>]*class="site-modal"[\s\S]*?<\/dialog>/.exec(html)?.[0];
			assert.ok(welcome, 'the welcome is included in the server document');
			assert.match(welcome, /<a[^>]*href="https:\/\/zhovten\.games\/"[^>]*>Zhovten Games<\/a>/);
			assert.doesNotMatch(welcome, /\[Zhovten Games\]/);
			assert.match(welcome, /<h2[^>]*tabindex="-1"/i);
			assert.ok(
				welcome.indexOf('https://www.linkedin.com/company/IRONCREED') <
					welcome.indexOf('https://github.com/IRONCREED'),
			);
			assert.ok(welcome.indexOf('https://github.com/IRONCREED') < welcome.indexOf('https://t.me/'));
			const directory = /<nav[^>]*class="policy-directory project-directory"[\s\S]*?<\/nav>/.exec(
				html,
			)?.[0];
			assert.ok(directory);
			for (const target of ['about', 'material-cycle', 'anthem']) {
				assert.ok(directory.includes(`href="/${locale}/pages/${target}"`));
			}
			assert.doesNotMatch(
				html,
				/class="companion-toggle"/,
				'an inert collapse button must not appear without JavaScript',
			);
			if (slug === 'about') assert.match(html, /class="companion-js-required"/);
		}
	}
});
