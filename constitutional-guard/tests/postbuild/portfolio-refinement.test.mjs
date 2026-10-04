import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { createCompiledSiteDriver } from '../../testing-interface/site-driver.mjs';

test('portfolio priority, open identity paragraphs and LinkedIn anchor agree in both locales', async () => {
	const pages = JSON.parse(
		await readFile(
			path.join(process.env.IRON_WARDEN_PROJECT_ROOT, 'semantic-core/dist/site/pages.json'),
			'utf8',
		),
	);
	const site = await createCompiledSiteDriver();
	for (const locale of ['uk', 'en']) {
		const page = pages.find((p) => p.id === `page.about.${locale}`);
		const html = await (await site.request(`/${locale}/pages/about`)).text();
		const projects = page.aboutStory.sections.find((s) => s.kind === 'portfolio').entries;
		const roots = new Map(projects.filter((p) => !p.parentId).map((p) => [p.id, p]));
		const ids = [
			...html.matchAll(/<details class="practice-project" id="practice-project-([^"]+)"/g),
		]
			.map((m) => m[1])
			.filter((id) => roots.has(id));
		assert.equal(ids.length, roots.size);
		const types = page.aboutStory.practiceMap.workTypes.map((type) => type.code);
		const ranks = ids.map((id) => types.indexOf(roots.get(id).primaryWorkType));
		assert.ok(ranks.every((rank, i) => rank >= 0 && (i === 0 || rank >= ranks[i - 1])));
		assert.ok(ids.indexOf('ironcreed-security') < ids.indexOf('grandma-narrative-game-design'));
		assert.ok(ids.indexOf('interdead') < ids.indexOf('xitatxen-text-slots'));
		assert.match(html, /href="#team-profiles"/);
		assert.match(html, /<section id="team-profiles" tabindex="-1"/);
		assert.doesNotMatch(html, /about-iron-creed-identity/);
		assert.doesNotMatch(html, /id="about-cycle-title"/);
		const heading = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1];
		assert.ok(heading?.includes(page.title));
		assert.equal(page.aboutStory.transition, undefined);
		const intro = /class="content-page-header__identity">([\s\S]*?)<\/div><\/div>/.exec(html)?.[1];
		assert.ok(intro);
		assert.equal((intro.match(/<p>/g) ?? []).length, 3);
		assert.match(intro, /href="https:\/\/zhovten.games\/"/);
	}
});
