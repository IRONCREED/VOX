import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import { format, resolveConfig } from 'prettier';

const atlas = JSON.parse(
	await readFile(
		new URL('../node_modules/world-atlas/countries-110m.json', import.meta.url),
		'utf8',
	),
);
const countries = feature(atlas, atlas.objects.countries);
countries.features = countries.features.filter((item) => item.id !== '010');
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
	await mkdir(new URL('../src/interface-system/geography/', import.meta.url), { recursive: true });
	await writeFile(target, text);
}
console.log(
	`Practice map: ${output.countries.length} countries; local Natural Earth geometry verified.`,
);
