import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { readCanonicalJson, readCanonicalText } from '../testing-interface/site-driver.mjs';

function cssBlock(source, selector) {
	const start = source.indexOf(`${selector} {`);
	assert.notEqual(start, -1, `missing CSS selector ${selector}`);
	const end = source.indexOf('}', start);
	assert.notEqual(end, -1, `unterminated CSS selector ${selector}`);
	return source.slice(start, end + 1);
}

async function importTypeScriptModule(relativePath) {
	const source = await readCanonicalText(relativePath);
	const output = ts.transpileModule(source, {
		compilerOptions: {
			module: ts.ModuleKind.ESNext,
			target: ts.ScriptTarget.ES2022,
		},
	}).outputText;
	const url = `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`;
	return import(url);
}

test('ICW-HIST-0005: the interface correction act remains executable', async () => {
	const [acts, css, companion, loader, theme, amendment] = await Promise.all([
		readCanonicalJson('governance/acts.json'),
		readCanonicalText('src/interface-system/iron-creed-interface.css'),
		readCanonicalText('src/interface-system/components/companion-panel.tsx'),
		readCanonicalText('src/interface-system/components/loading-gate.tsx'),
		readCanonicalText('src/interface-system/components/theme-switcher.tsx'),
		readCanonicalText('governance/legislation/INTERFACE_CORRECTIONS_2026-07-30.md'),
	]);

	assert.ok(
		acts.acts.some(
			(act) =>
				act.id === 'icw-act-interface-corrections-001' &&
				act.revision === '1.0.0' &&
				act.status === 'active',
		),
	);
	assert.match(amendment, /ICW-CORR08/);

	for (const selector of [
		'.header-crest',
		'.nav-icon',
		'.material-card__folder',
		'.material-pagination__pages a',
		'.article-route > a:first-child',
		'.article-action__icon',
		'.suggestion-list',
		'.suggestion-list button',
		'.continue-button',
		'.loading-gate',
	]) {
		const block = cssBlock(css, selector);
		assert.match(block, /display:\s*flex/);
		assert.doesNotMatch(block, /display:\s*grid/);
	}

	assert.doesNotMatch(companion, /className="companion-signal/);
	assert.match(companion, /setAnswerRun\(\(current\) => current \+ 1\)/);
	assert.match(loader, /MINIMUM_VISIBLE_TIME = 2400/);
	assert.match(loader, /MAXIMUM_WAIT_TIME = 6000/);
	assert.match(theme, /THEME_STORAGE_KEY/);
	assert.match(theme, /document\.documentElement\.dataset\.theme/);

	const typewriter = await importTypeScriptModule(
		'src/interface-system/behaviors/typewriter-run.ts',
	);
	const completedRun = { runId: 'question:1', visibleLength: 18 };
	assert.equal(typewriter.visibleLengthForRun(completedRun, 'question:2'), 0);

	let repeatedRun = completedRun;
	for (let index = 0; index < 9; index += 1) {
		repeatedRun = typewriter.advanceTypewriterFrame(repeatedRun, 'question:2', 18);
	}
	assert.deepEqual(repeatedRun, { runId: 'question:2', visibleLength: 18 });

	const zenodo = await importTypeScriptModule('src/content-catalog/adapters/zenodo-record.ts');
	const publication = {
		provider: 'zenodo',
		recordId: '20608559',
		title: 'Literate Programming',
		doi: '10.5281/zenodo.20608559',
		pdfFile: '01-Literate-Programming-EN.pdf',
	};
	const resolved = zenodo.resolveZenodoPdf(
		{
			id: 20608559,
			files: [
				{
					key: publication.pdfFile,
					size: 383500,
					links: {
						self: 'https://zenodo.org/api/records/20608559/files/01-Literate-Programming-EN.pdf/content',
					},
				},
			],
		},
		publication,
	);
	assert.equal(resolved.size, 383500);
	assert.match(resolved.downloadUrl, /^https:\/\/zenodo\.org\/api\/records\//);
});
