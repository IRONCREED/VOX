import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompiledSiteDriver } from '../../testing-interface/site-driver.mjs';

test('both new bilingual articles render every approved graph with an accessible transcript', async () => {
	const site = await createCompiledSiteDriver();
	for (const [route, count] of [
		['/uk/research/rehulovana-dostupnist', 11],
		['/en/research/regulated-availability', 11],
		['/uk/programming/cloudflare-001-crawler-surface-policy', 14],
		['/en/programming/cloudflare-001-crawler-surface-policy', 14],
	]) {
		const response = await site.request(route);
		assert.equal(response.status, 200, route);
		const html = await response.text();
		assert.equal((html.match(/class="ic-diagram"/g) ?? []).length, count, route);
		assert.equal(
			(html.match(/class="ic-diagram-transcript(?:\s[^"]*)?"/g) ?? []).length,
			count,
			route,
		);
		assert.doesNotMatch(html, /class="diagram-brief"/);
		assert.match(html, /article-series-navigation/);
		if (route.includes('cloudflare')) {
			assert.match(html, /href="https:\/\/github\.com\/IRONCREED\/cloudflare"/);
			assert.doesNotMatch(html, /TheWorldOfCanon|pan-canon/);
		}
	}
});

test('the WSL token question has its own route and only the justified case association', async () => {
	const site = await createCompiledSiteDriver();
	for (const locale of ['uk', 'en']) {
		const response = await site.request(`/${locale}/questions/q.cloudflare.api-token-wsl`);
		assert.equal(response.status, 200);
		const html = await response.text();
		assert.match(html, /WSL/);
		assert.match(html, /cloudflare-001-crawler-surface-policy/);
		assert.doesNotMatch(html, /href="[^"\s]*regulated-availability[^"\s]*\?question=q\.cloudflare/);
	}
});
