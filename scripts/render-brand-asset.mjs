import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sourcePath = path.join(projectRoot, 'src/interface-system/brand/iron-creed-ic.png');
const outputPaths = {
	brand: path.join(projectRoot, 'public/brand/iron-creed-mark.svg'),
	favicon: path.join(projectRoot, 'public/favicon.svg'),
};

export function renderBrandAsset(sourceDataUrl, sourceDigest) {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 768" data-source-sha256="${sourceDigest}">
\t<title>IRON CREED</title>
\t<image href="${sourceDataUrl}" width="768" height="768" preserveAspectRatio="xMidYMid meet" />
</svg>
`;
}

export function renderFaviconAsset(sourceDataUrl, sourceDigest) {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" data-source-sha256="${sourceDigest}">
\t<title>IRON CREED</title>
\t<desc>Optically enlarged faceted IC monogram</desc>
\t<rect x="4" y="4" width="120" height="120" rx="24" fill="#eef1f0" />
\t<image href="${sourceDataUrl}" x="8" y="3" width="112" height="122" preserveAspectRatio="xMidYMid meet" />
</svg>
`;
}

const source = await readFile(sourcePath);
const sourceDataUrl = `data:image/png;base64,${source.toString('base64')}`;
const sourceDigest = createHash('sha256').update(source).digest('hex');
const expectedAssets = new Map([
	[outputPaths.brand, renderBrandAsset(sourceDataUrl, sourceDigest)],
	[outputPaths.favicon, renderFaviconAsset(sourceDataUrl, sourceDigest)],
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
				`${path.relative(projectRoot, outputPath)} does not match the canonical brand master. Run npm run brand:generate.`,
			);
		}
	}
	console.log('Brand assets match the canonical geometry.');
} else {
	throw new Error(`Unknown mode ${mode}. Use --check or --write.`);
}
