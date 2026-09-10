import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = process.env.IRON_WARDEN_PROJECT_ROOT;
const readText = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

test('ICW-HIST-0057: release 1.18.0 preserves the 1.17.0 corpus and published About acceptance', async () => {
	const [packageManifest, corpus, pages, assets, story, slider, template] = await Promise.all([
		readJson('package.json'),
		readJson('semantic-core/corpus.yaml'),
		readJson('semantic-core/corpus/pages/registry.json'),
		readJson('semantic-core/corpus/assets/registry.json'),
		readText('src/interface-system/components/about-story.tsx'),
		readText('src/interface-system/components/about-card-slider.tsx'),
		readText('src/interface-system/templates/content-page-template.tsx'),
	]);

	assert.equal(packageManifest.version, '1.18.0');
	assert.equal(corpus.contentVersion, '1.17.0');
	assert.equal(assets.length, 82);
	assert.ok(assets.every((asset) => asset.assetType === 'diagram'));

	const about = pages.find((entry) => entry.id === 'page.about');
	assert.equal(about.revision, 9);
	assert.equal(about.aboutStory.sections.length, 8);
	assert.equal(
		about.aboutStory.sections.filter((entry) => entry.status === 'placeholder').length,
		0,
	);
	assert.equal(
		about.aboutStory.sections.find((entry) => entry.id === 'projects').entries.length,
		5,
	);
	const testimonials = about.aboutStory.sections.find((entry) => entry.id === 'testimonials');
	assert.equal(testimonials.status, 'active');
	assert.equal(testimonials.entries.length, 19);
	assert.ok(testimonials.entries.every((entry) => /^[A-Z]\. [A-Z]\.$/.test(entry.title.en)));
	assert.equal(testimonials.link, undefined);
	assert.match(
		testimonials.body.en.join(' '),
		/original reviews on specific platforms are available on request/,
	);
	assert.match(testimonials.body.uk.join(' '), /Негативних відгуків у нас немає/);
	assert.match(JSON.stringify(testimonials), /I hired Semen for a project for my client/);
	assert.match(JSON.stringify(testimonials), /minimal compliance/);
	assert.match(JSON.stringify(testimonials), /Thank you\. The work is done/);
	assert.doesNotMatch(JSON.stringify(testimonials), /Ruslan|Руслан/);
	assert.equal(
		about.aboutStory.sections
			.find((entry) => entry.id === 'people')
			.entries.find((entry) => entry.id === 'pan-canon').title.en,
		'Sam Starling',
	);

	assert.match(story, /section\.kind === 'portfolio' \|\| section\.kind === 'testimonials'/);
	assert.match(story, /<AboutCardSlider/);
	assert.match(slider, /useSyncExternalStore/);
	assert.match(slider, /\(\) => false/);
	assert.match(slider, /enhanced && slides\.length > 1/);
	assert.match(template, /triggerLabel=\{identityTrigger\}/);
	assert.match(template, /variant="inline"/);
});

test('ICW-HIST-0057: the wide companion follows the header and then fills the available viewport', async () => {
	const [styles, header, companion] = await Promise.all([
		readText('src/interface-system/iron-creed-interface.css'),
		readText('src/interface-system/components/site-header.tsx'),
		readText('src/interface-system/components/companion-panel.tsx'),
	]);

	assert.match(styles, /FIRST PUBLICATION POLISH/);
	assert.match(
		styles,
		/\.system-header\s*\{\s*grid-template-columns: var\(--sidebar-active-width\) minmax\(0, 1fr\)/,
	);
	assert.doesNotMatch(header, /header-reserved/);
	assert.match(styles, /\.sidebar-resize-handle::after\s*\{[\s\S]*?top: 28px/);
	assert.match(
		styles,
		/\.material-card\s*\{[\s\S]*?contain: paint;[\s\S]*?clip-path: inset\(0 round 10px\)/,
	);
	assert.match(styles, /\.article-document\s*\{\s*flex: 0 0 auto/);
	assert.match(styles, /\.article-document > \.article-body > :first-child\s*\{\s*margin-top: 0/);
	assert.match(
		styles,
		/\.article-body--scenario-log h3::before\s*\{\s*display: none;\s*content: none/,
	);
	assert.match(
		styles,
		/\.diagram-brief,[\s\S]*?\.ic-diagram\s*\{[\s\S]*?border-radius: 4px;[\s\S]*?box-shadow: none/,
	);
	assert.match(
		styles,
		/\.ic-diagram \.react-flow__controls-button\s*\{[\s\S]*?width: 34px;[\s\S]*?height: 34px/,
	);
	assert.match(
		styles,
		/\.about-card-slider\.is-enhanced \.about-card-slider__viewport\s*\{\s*overflow: hidden/,
	);
	assert.match(styles, /\.about-service\s*\{\s*column-gap:[\s\S]*?row-gap: 20px/);
	assert.match(styles, /\.content-page-header\s*\{\s*z-index: 200/);
	assert.match(styles, /\.contextual-hint\.is-open\s*\{\s*z-index: 1000/);
	assert.match(
		styles,
		/\.interface-shell::after\s*\{[\s\S]*?grid-column: 1;[\s\S]*?grid-row: 2;[\s\S]*?align-self: stretch/,
	);
	assert.match(styles, /\.loading-gate\s*\{[\s\S]*?z-index: 20000;[\s\S]*?isolation: isolate/);
	assert.match(
		styles,
		/\.protocol-folder__stack\s*\{[\s\S]*?transform: perspective\(900px\) rotateX\(54deg\) rotateZ\(22deg\)/,
	);
	assert.doesNotMatch(styles, /transform-style: flat/);
	assert.match(
		styles,
		/\.about-card-slider\.is-enhanced \.about-card-slider__track\s*\{[\s\S]*?align-items: flex-start/,
	);
	assert.match(styles, /\.about-card-slider__controls\s*\{[\s\S]*?position: absolute/);
	assert.match(companion, /window\.matchMedia\('\(min-width: 1321px\)'\)/);
	assert.match(companion, /header\.getBoundingClientRect\(\)\.bottom <= 7/);
	assert.match(companion, /setHeaderPassed\(nextHeaderPassed\)/);
	assert.match(companion, /data-header-passed=\{headerPassed\}/);
	assert.match(
		styles,
		/\.companion-column\s*\{[\s\S]*?position: sticky;[\s\S]*?top: 7px;[\s\S]*?height: calc\(100dvh - 111px\)/,
	);
	assert.match(
		styles,
		/\.companion-column\[data-header-passed='true'\]\s*\{\s*height: calc\(100dvh - 14px\)/,
	);
});
