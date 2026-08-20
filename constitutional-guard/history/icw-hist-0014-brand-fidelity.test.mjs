import assert from 'node:assert/strict';
import test from 'node:test';
import { readCanonicalJson, readCanonicalText } from '../testing-interface/site-driver.mjs';

test('ICW-HIST-0014: the approved silhouette, vector frames, and theme inversion remain canonical', async () => {
	const [geometry, asset, brand, css, generator, packageManifest, acts, act] = await Promise.all([
		readCanonicalJson('src/interface-system/brand/iron-creed-mark.json'),
		readCanonicalText('public/brand/iron-creed-mark.svg'),
		readCanonicalText('src/interface-system/components/brand-mark.tsx'),
		readCanonicalText('src/interface-system/iron-creed-interface.css'),
		readCanonicalText('scripts/render-brand-asset.mjs'),
		readCanonicalJson('package.json'),
		readCanonicalJson('governance/acts.json'),
		readCanonicalText('governance/legislation/BRAND_FIDELITY_2026-08-02.md'),
	]);

	assert.equal(geometry.viewBox, '0 0 128 158');
	assert.ok(geometry.tridentPath.split('M').length - 1 >= 4);
	assert.deepEqual(
		geometry.pulseFrames.map((frame) => frame.id),
		['start', 'rise', 'peak', 'fall', 'fade', 'rest'],
	);
	assert.equal(geometry.pulseFrames[0].path, '');
	assert.equal(geometry.pulseFrames.at(-1).path, '');
	assert.equal(
		geometry.pulseFrames.find((frame) => frame.id === geometry.staticFrame)?.path,
		geometry.pulsePath,
	);
	assert.equal(new Set(geometry.pulseFrames.map((frame) => frame.path)).size, 5);
	assert.equal(geometry.colours.pulse, '#e52b20');
	assert.equal(geometry.colours.ink, geometry.colours.invertedOutline);
	assert.equal(geometry.colours.outline, geometry.colours.invertedInk);

	assert.match(brand, /geometry\.pulseFrames\.map/);
	assert.match(brand, /data-brand-frame-count=\{geometry\.pulseFrames\.length\}/);
	assert.match(brand, /motion === ['"]static['"]/);
	assert.match(brand, /<PulseTrace path=\{geometry\.pulsePath\} \/>/);
	assert.doesNotMatch(brand, /<img|next\/image|backgroundImage/);

	assert.match(css, /color:\s*var\(--brand-light-ink\)/);
	assert.match(
		css,
		/html\[data-theme=['"]dark['"]\] \.brand-mark\s*\{[\s\S]*?var\(--brand-dark-ink\)/,
	);
	assert.match(
		css,
		/html\[data-theme=['"]dark['"]\] \.brand-mark__trace--outline\s*\{[\s\S]*?var\(--brand-dark-outline\)/,
	);
	assert.match(css, /brand-pulse-trace-rise/);
	assert.match(css, /brand-pulse-trace-peak/);
	assert.match(css, /brand-pulse-trace-fall/);
	assert.match(css, /brand-pulse-trace-fade/);
	assert.doesNotMatch(css, /\.brand-mark[^}]*filter:\s*invert/);

	assert.match(generator, /prefers-color-scheme:\s*dark/);
	assert.match(asset, /prefers-color-scheme:\s*dark/);
	assert.match(asset, new RegExp(geometry.tridentPath.replaceAll('?', '\\?')));
	assert.equal(asset.split(geometry.pulsePath).length - 1, 2);

	assert.equal(packageManifest.version, '0.6.1');
	for (const id of [
		'icw-act-development-001',
		'icw-act-site-experience-001',
		'icw-act-patterns-001',
	]) {
		assert.equal(acts.acts.find((entry) => entry.id === id)?.revision, '0.6.1');
	}
	assert.ok(
		acts.acts.some(
			(entry) =>
				entry.id === 'icw-act-brand-fidelity-001' &&
				entry.revision === '1.0.0' &&
				entry.status === 'active',
		),
	);
	assert.match(act, /ICW-FIDELITY05/);
});
