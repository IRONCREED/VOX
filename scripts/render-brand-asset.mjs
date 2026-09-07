import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

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

// Raster fallbacks use the same accepted master, with a neutral backing for
// contrast against both light and dark browser chrome.
const favicon = await sharp(source)
	.trim({ background: '#00000000', threshold: 8 })
	.resize(224, 224, { fit: 'contain', background: '#eeeeee' })
	.extend({ top: 16, bottom: 16, left: 16, right: 16, background: '#eeeeee' })
	.flatten({ background: '#eeeeee' })
	.png()
	.toBuffer();
for (const size of [32, 48, 180, 192, 512]) {
	const file = size === 180 ? 'apple-touch-icon.png' : `favicon-${size}.png`;
	expectedAssets.set(
		path.join(projectRoot, 'public', file),
		await sharp(favicon).resize(size, size).png().toBuffer(),
	);
}
const icoImages = await Promise.all(
	[16, 32, 48].map(async (size) => ({
		size,
		data: await sharp(favicon).resize(size, size).png().toBuffer(),
	})),
);
const icoHeader = Buffer.alloc(6 + 16 * icoImages.length);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(icoImages.length, 4);
let icoOffset = icoHeader.length;
for (const [index, { size, data }] of icoImages.entries()) {
	const entry = 6 + index * 16;
	icoHeader[entry] = size;
	icoHeader[entry + 1] = size;
	icoHeader.writeUInt16LE(1, entry + 4);
	icoHeader.writeUInt16LE(32, entry + 6);
	icoHeader.writeUInt32LE(data.length, entry + 8);
	icoHeader.writeUInt32LE(icoOffset, entry + 12);
	icoOffset += data.length;
}
expectedAssets.set(
	path.join(projectRoot, 'public/favicon.ico'),
	Buffer.concat([icoHeader, ...icoImages.map(({ data }) => data)]),
);

for (const name of ['tent', 'observer', 'code', 'microscope', 'branches', 'book']) {
	const master = path.join(projectRoot, 'src/interface-system/brand/navigation', `${name}.png`);
	for (const size of [96, 192]) {
		const asset = await sharp(master)
			.trim({ background: '#00000000', threshold: 8 })
			.resize(size - 8, size - 8, { fit: 'contain', background: '#00000000' })
			.extend({ top: 4, bottom: 4, left: 4, right: 4, background: '#00000000' })
			.png()
			.toBuffer();
		expectedAssets.set(
			path.join(projectRoot, 'public/brand/navigation', `${name}-${size}.png`),
			asset,
		);
	}
}
const mode = process.argv[2] ?? '--check';

if (mode === '--write') {
	for (const [outputPath, expected] of expectedAssets) {
		await writeFile(outputPath, expected);
		console.log(`Generated ${path.relative(projectRoot, outputPath)}`);
	}
} else if (mode === '--check') {
	for (const [outputPath, expected] of expectedAssets) {
		const actual = await readFile(outputPath);
		if (!actual.equals(Buffer.from(expected))) {
			throw new Error(
				`${path.relative(projectRoot, outputPath)} does not match the canonical brand master. Run npm run brand:generate.`,
			);
		}
	}
	console.log('Brand assets match the canonical geometry.');
} else {
	throw new Error(`Unknown mode ${mode}. Use --check or --write.`);
}
