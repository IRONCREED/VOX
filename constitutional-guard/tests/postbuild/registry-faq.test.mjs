import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { createCompiledSiteDriver } from '../../testing-interface/site-driver.mjs';

const root = process.env.IRON_WARDEN_PROJECT_ROOT;
function schemas(html) {
	return [
		...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
	].map((match) => JSON.parse(match[1]));
}

test('editorial registry and material FAQs publish complete answers and never claim user-submitted QAPage', async () => {
	const questions = JSON.parse(
		await readFile(path.join(root, 'semantic-core/dist/site/questions.json'), 'utf8'),
	);
	const views = JSON.parse(
		await readFile(path.join(root, 'semantic-core/dist/site/views.json'), 'utf8'),
	);
	const materials = JSON.parse(
		await readFile(path.join(root, 'semantic-core/dist/site/materials.json'), 'utf8'),
	);
	const site = await createCompiledSiteDriver();
	for (const locale of ['uk', 'en']) {
		for (const suffix of ['/pages/corpus-index', '/questions/q.iron-creed.model']) {
			const response = await site.request(`/${locale}${suffix}`);
			assert.equal(response.status, 200);
			const html = await response.text();
			const faq = schemas(html).find((entry) => entry['@type'] === 'FAQPage');
			assert.ok(faq);
			assert.equal(faq.inLanguage, locale);
			assert.equal(faq.mainEntity.length, suffix.includes('/questions/') ? 1 : 476);
			assert.doesNotMatch(html, /"@type":"QAPage"/);
			for (const entry of faq.mainEntity) {
				const id = entry.url.split('/').at(-1);
				const question = questions.find((item) => item.id === id);
				assert.equal(entry.name, question.text[locale]);
				assert.equal(entry.acceptedAnswer.text, question.answer[locale]);
			}
		}
		const material = materials.find(
			(entry) => entry.locale === locale && entry.materialId === 'material.why-documentation',
		);
		const response = await site.request(`/${locale}/${material.category}/${material.slug}`);
		assert.equal(response.status, 200);
		const html = await response.text();
		assert.match(html, /class="editorial-questions"/);
		const faq = schemas(html).find((entry) => entry['@type'] === 'FAQPage');
		const view = views.find((entry) => entry.id === material.conversationViewId);
		assert.deepEqual(
			new Set(faq.mainEntity.map((entry) => entry.url.split('/').at(-1))),
			new Set(view.nodes),
		);
		assert.ok(schemas(html).some((entry) => entry['@type'] === 'Article'));
	}
});
