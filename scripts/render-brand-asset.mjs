import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const geometryPath = path.join(projectRoot, 'src/interface-system/brand/iron-creed-mark.json');
const outputPaths = {
	brand: path.join(projectRoot, 'public/brand/iron-creed-mark.svg'),
	favicon: path.join(projectRoot, 'public/favicon.svg'),
};

function escapeAttribute(value) {
	return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;');
}

function renderPaths(geometry) {
	const endpoints = geometry.endpoints
		.map(
			(endpoint) =>
				`\t<circle cx="${endpoint.cx}" cy="${endpoint.cy}" r="${endpoint.r}" fill="${geometry.colours.pulse}" />`,
		)
		.join('\n');

	return `\t<path class="iron-creed-mark__ink" d="${escapeAttribute(geometry.tridentPath)}" />
\t<path d="${escapeAttribute(geometry.baselinePath)}" stroke="${geometry.colours.pulse}" stroke-width="${geometry.strokes.baseline}" stroke-linecap="round" />
\t<path class="iron-creed-mark__outline" d="${escapeAttribute(geometry.pulsePath)}" stroke-width="${geometry.strokes.outline}" stroke-linecap="round" stroke-linejoin="miter" />
\t<path d="${escapeAttribute(geometry.pulsePath)}" stroke="${geometry.colours.pulse}" stroke-width="${geometry.strokes.signal}" stroke-linecap="round" stroke-linejoin="miter" />
${endpoints}`;
}

function renderTheme(geometry) {
	return `\t<style>
\t\t.iron-creed-mark__ink { fill: ${geometry.colours.ink}; }
\t\t.iron-creed-mark__outline { stroke: ${geometry.colours.outline}; }
\t\t@media (prefers-color-scheme: dark) {
\t\t\t.iron-creed-mark__ink { fill: ${geometry.colours.invertedInk}; }
\t\t\t.iron-creed-mark__outline { stroke: ${geometry.colours.invertedOutline}; }
\t\t}
\t</style>`;
}

export function renderBrandAsset(geometry) {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${escapeAttribute(geometry.viewBox)}" fill="none">
\t<title>IRON CREED</title>
${renderTheme(geometry)}
${renderPaths(geometry)}
</svg>
`;
}

export function renderFaviconAsset(geometry) {
	const [, , width, height] = geometry.viewBox.split(/\s+/).map(Number);
	const side = Math.max(width, height);
	const offsetX = (side - width) / 2;
	const offsetY = (side - height) / 2;
	const paths = renderPaths(geometry)
		.split('\n')
		.map((line) => `\t${line}`)
		.join('\n');

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}" fill="none">
\t<title>IRON CREED</title>
\t<desc>Static peak state of the IRON CREED mark</desc>
${renderTheme(geometry)}
\t<g transform="translate(${offsetX} ${offsetY})">
${paths}
\t</g>
</svg>
`;
}

const geometry = JSON.parse(await readFile(geometryPath, 'utf8'));
const expectedAssets = new Map([
	[outputPaths.brand, renderBrandAsset(geometry)],
	[outputPaths.favicon, renderFaviconAsset(geometry)],
]);
const mode = process.argv[2] ?? '--check';

if (mode === '--write') {
	for (const [outputPath, expected] of expectedAssets) {
		await writeFile(outputPath, expected);
		console.log(`Generated ${path.relative(projectRoot, outputPath)}`);
	}
} else if (mode === '--check') {
	for (const [outputPath, expected] of expectedAssets) {
		const actual = await readFile(outputPath, 'utf8');
		if (actual !== expected) {
			throw new Error(
				`${path.relative(projectRoot, outputPath)} does not match the canonical brand geometry. Run npm run brand:generate.`,
			);
		}
	}
	console.log('Brand assets match the canonical geometry.');
} else {
	throw new Error(`Unknown mode ${mode}. Use --check or --write.`);
}
