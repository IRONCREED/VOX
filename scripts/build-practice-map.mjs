import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { geoBounds, geoContains, geoNaturalEarth1, geoPath } from 'd3-geo';
import { pathToFileURL } from 'node:url';
import { feature, merge } from 'topojson-client';
import { format, resolveConfig } from 'prettier';

export function preparePracticeGeography(atlas) {
	const objects = atlas.objects.countries.geometries;
	const ukraine = objects.find((item) => item.id === '804');
	const russia = objects.find((item) => item.id === '643');
	if (ukraine?.type !== 'Polygon' || russia?.type !== 'MultiPolygon') {
		throw new Error('Unexpected Ukraine/Russia topology.');
	}
	const candidates = russia.arcs.flatMap((arcs, index) => {
		const polygon = { type: 'Polygon', arcs };
		return geoContains(feature(atlas, polygon), [34.1, 44.95]) ? [{ polygon, index }] : [];
	});
	if (candidates.length !== 1) throw new Error('Crimea polygon is not uniquely identifiable.');
	const { polygon, index } = candidates[0];
	const [[west, south], [east, north]] = geoBounds(feature(atlas, polygon));
	if (west < 32 || east > 37 || south < 44 || north > 46.5) {
		throw new Error('Unexpected Crimea polygon bounds.');
	}
	const countries = feature(atlas, atlas.objects.countries);
	countries.features.find((item) => item.id === '804').geometry = merge(atlas, [ukraine, polygon]);
	const russianGeometry = countries.features.find((item) => item.id === '643').geometry;
	russianGeometry.coordinates = russianGeometry.coordinates.filter((_, i) => i !== index);
	countries.features = countries.features.filter((item) => item.id !== '010');
	return countries;
}

async function build() {
	const atlas = JSON.parse(
		await readFile(
			new URL('../node_modules/world-atlas/countries-110m.json', import.meta.url),
			'utf8',
		),
	);
	const countries = preparePracticeGeography(atlas);
	const projection = geoNaturalEarth1().fitExtent(
		[
			[16, 16],
			[984, 484],
		],
		countries,
	);
	const path = geoPath(projection).digits(2);
	const output = {
		width: 1000,
		height: 500,
		countries: countries.features.map((item, index) => ({
			id: item.id ?? `unassigned-${index}`,
			path: path(item),
			point: path.centroid(item).map((n) => Math.round(n * 100) / 100),
		})),
	};
	const target = new URL('../src/interface-system/geography/world-countries.json', import.meta.url);
	const text = await format(JSON.stringify(output), {
		...(await resolveConfig(target.pathname)),
		parser: 'json',
	});
	if (process.argv.includes('--check')) {
		if ((await readFile(target, 'utf8')) !== text) throw new Error('Practice map geometry drift.');
	} else {
		await mkdir(new URL('../src/interface-system/geography/', import.meta.url), {
			recursive: true,
		});
		await writeFile(target, text);
	}
	console.log(
		`Practice map: ${output.countries.length} countries; local Natural Earth geometry verified.`,
	);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await build();
