import assert from 'node:assert/strict';
import test from 'node:test';
import { readCanonicalJson, readCanonicalText } from '../testing-interface/site-driver.mjs';

test('ICW-HIST-0012: the canonical mark, pulse states, and adaptive header remain coherent', async () => {
	const [
		geometry,
		asset,
		brand,
		header,
		loader,
		folder,
		companion,
		actions,
		css,
		packageManifest,
		acts,
		act,
	] = await Promise.all([
		readCanonicalJson('src/interface-system/brand/iron-creed-mark.json'),
		readCanonicalText('public/brand/iron-creed-mark.svg'),
		readCanonicalText('src/interface-system/components/brand-mark.tsx'),
		readCanonicalText('src/interface-system/components/site-header.tsx'),
		readCanonicalText('src/interface-system/components/loading-gate.tsx'),
		readCanonicalText('src/interface-system/components/protocol-folder.tsx'),
		readCanonicalText('src/interface-system/components/companion-panel.tsx'),
		readCanonicalText('src/interface-system/components/article-actions.tsx'),
		readCanonicalText('src/interface-system/iron-creed-interface.css'),
		readCanonicalJson('package.json'),
		readCanonicalJson('governance/acts.json'),
		readCanonicalText('governance/legislation/BRAND_PULSE_2026-08-02.md'),
	]);

	assert.match(geometry.viewBox, /^0 0 \d+ \d+$/);
	assert.ok(geometry.tridentPath.length > 80);
	assert.ok(geometry.pulsePath.length > 40);
	assert.equal(geometry.endpoints.length, 2);
	assert.match(asset, new RegExp(geometry.tridentPath));
	assert.match(asset, new RegExp(geometry.baselinePath));
	assert.equal(asset.split(geometry.pulsePath).length - 1, 2);

	assert.match(brand, /import geometry from ['"]\.\.\/brand\/iron-creed-mark\.json['"]/);
	assert.match(brand, /motion\?: ['"]animated['"] \| ['"]static['"]/);
	assert.match(brand, /data-brand-motion=\{motion\}/);
	assert.match(brand, /className="brand-mark__trace brand-mark__trace--signal"/);
	assert.doesNotMatch(brand, /next\/image/);

	const controlsPosition = header.indexOf('className="header-crest"');
	const identityPosition = header.indexOf('className="header-wordmark"');
	const reservedPosition = header.indexOf('className="header-reserved"');
	assert.ok(controlsPosition >= 0 && controlsPosition < identityPosition);
	assert.ok(identityPosition < reservedPosition);
	assert.match(header, /<BrandMark motion="animated" \/>/);
	assert.doesNotMatch(header, /<PulseLine/);
	assert.match(loader, /<BrandMark inverted motion="animated" \/>/);
	assert.doesNotMatch(loader, /<PulseLine/);
	assert.match(folder, /<BrandMark compact motion="static" \/>/);
	assert.match(companion, /<PulseLine compact \/>/);
	assert.doesNotMatch(companion, /<i \/> \{copy\.companionActive\}/);
	assert.match(actions, /article-actions--dialogue-only/);

	assert.match(css, /\.brand-mark--animated \.brand-mark__trace\s*\{[\s\S]*?brand-pulse-trace/);
	assert.match(css, /\.header-wordmark:hover \.brand-mark--animated[\s\S]*?1\.25s/);
	assert.match(
		css,
		/@media \(min-width: 1321px\)[\s\S]*?\.article-action--discuss[\s\S]*?display:\s*none/,
	);
	assert.match(css, /@media \(max-width: 1320px\)[\s\S]*?\.header-reserved[\s\S]*?display:\s*none/);
	assert.match(
		css,
		/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.brand-mark--animated \.brand-mark__trace[\s\S]*?animation:\s*none/,
	);

	assert.equal(packageManifest.version, '0.6.0');
	assert.match(packageManifest.scripts.check, /brand:check/);
	assert.ok(
		acts.acts.some(
			(entry) =>
				entry.id === 'icw-act-brand-pulse-001' &&
				entry.revision === '1.0.0' &&
				entry.status === 'active',
		),
	);
	assert.match(act, /ICW-PULSE06/);
});
