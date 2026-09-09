import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompiledSiteDriver } from '../../testing-interface/site-driver.mjs';

test('Cloudflare renders its document title and daily audience in both locales', async () => {
	const site = await createCompiledSiteDriver();
	for (const locale of ['uk', 'en']) {
		const response = await site.request(
			`/${locale}/programming/cloudflare-001-crawler-surface-policy`,
		);
		assert.equal(response.status, 200);
		const html = await response.text();
		assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1);
		assert.match(
			html,
			locale === 'en'
				? /<h2[^>]*>Case 001\. Cloudflare Crawler Surface Policy: Controlling Bot Access to URLs<\/h2>/
				: /<h2[^>]*>Кейс №1\. Cloudflare Crawler Surface Policy: контроль доступу ботів до URL<\/h2>/,
		);
		assert.doesNotMatch(html, /<p># (?:Case 001\.|Кейс №1\.)/);
		assert.match(
			html,
			locale === 'en'
				? /daily audience of approximately <strong>400,000 unique users<\/strong>/
				: /щоденною аудиторією[^<]*<strong>400 тисяч унікальних користувачів<\/strong>/,
		);
		assert.doesNotMatch(html, /monthly audience|щомісячною аудиторією/);
		assert.doesNotMatch(html, /class="title-rule"/);
	}
});

test('material cycle captions introduce complete examples in chronological order', async () => {
	const site = await createCompiledSiteDriver();
	for (const locale of ['uk', 'en']) {
		const response = await site.request(`/${locale}/pages/material-cycle`);
		assert.equal(response.status, 200);
		const html = await response.text();
		const table = html.match(/<table>[\s\S]*?<\/table>/)?.[0];
		assert.ok(table);
		assert.match(
			table,
			locale === 'en'
				? /<caption>Examples of the material cycle in chronological order\.<\/caption><thead>/
				: /<caption>Приклади проходження циклу матеріалу в хронологічному порядку\.<\/caption><thead>/,
		);
		const rows = [...table.matchAll(/<tr><th scope="row">[\s\S]*?<\/tr>/g)].map(
			(match) => match[0],
		);
		assert.equal(rows.length, 3);
		assert.match(
			rows[0],
			locale === 'en'
				? /Research into technical writing and documentation/
				: /Дослідження технічного письма й документації/,
		);
		assert.match(rows[0], /zenodo\.20608558/);
		assert.match(rows[1], /zenodo\.21894242/);
		assert.match(rows[2], /github\.com\/IRONCREED\/cloudflare/);
	}
});
