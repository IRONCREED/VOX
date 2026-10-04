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
			...html.matchAll(
				/<(?:details class="practice-project"|div class="practice-project__reference") id="practice-project-([^"]+)"/g,
			),
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

test('game cases are compact references to one studio disclosure while technical children and reviews remain public', async () => {
	const site = await createCompiledSiteDriver();
	for (const locale of ['uk', 'en']) {
		const html = await (await site.request(`/${locale}/pages/about`)).text();
		assert.equal((html.match(/class="practice-project__reference"/g) ?? []).length, 11);
		assert.equal((html.match(/class="practice-project"/g) ?? []).length, 35);
		assert.equal((html.match(/class="practice-project practice-studio"/g) ?? []).length, 1);
		assert.equal((html.match(/class="practice-project__review"/g) ?? []).length, 19);
		assert.equal(
			(html.match(/class="practice-map__marker" data-kind="practice"/g) ?? []).length,
			7,
		);
		for (const id of [
			'clockwork-magick-game-master',
			'grandma-narrative-game-design',
			'interdead',
			'quokka-consulting',
			'safe-blind-zones-live-tester',
			'interdead-proto',
			'mcf-28-house-that-love-built',
		]) {
			assert.match(
				html,
				new RegExp(
					`<div class="practice-project__reference" id="practice-project-${id}"><a href="#studio-game-development"`,
				),
			);
			assert.doesNotMatch(html, new RegExp(`<details[^>]*id="practice-project-${id}"`));
		}
		for (const id of [
			'interdead-site',
			'interdead-core',
			'psyframework',
			'interdead-reference-library',
		]) {
			assert.match(
				html,
				new RegExp(`<details class="practice-project" id="practice-project-${id}"`),
			);
		}
		const disclosure =
			/<details class="practice-project practice-studio">([\s\S]*?)<\/details>/.exec(html)?.[1];
		assert.ok(disclosure);
		assert.match(disclosure, /<summary id="studio-game-development"/);
		assert.match(disclosure, /href="https:\/\/zhovten.games\/projects"/);
		assert.ok(
			html.indexOf('class="practice-project practice-studio"') >
				html.indexOf('id="practice-results"'),
		);
		assert.doesNotMatch(
			html,
			/Game-master work in 2020|A short-term contract engagement in spring 2026|робота ігрової майстрині охоплювала/,
		);
	}
});
