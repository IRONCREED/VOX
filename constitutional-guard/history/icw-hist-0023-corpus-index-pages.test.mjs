import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompiledSiteDriver } from '../testing-interface/site-driver.mjs';

test('ICW-HIST-0023: localized pages expose the complete public entity index', async () => {
	const site = await createCompiledSiteDriver();
	const [home, research, programming, deepQuestion, api] = await Promise.all([
		site.request('/uk/'),
		site.request('/uk/research/vid-tila-do-syhnalu'),
		site.request('/en/programming/why-documentation-matters'),
		site.request('/en/research/from-body-to-signal?question=q.channel-centrality'),
		site.request('/api/materials?locale=en&page=1'),
	]);

	assert.equal(home.status, 200);
	const homeHtml = await home.text();
	assert.match(homeHtml, /Індекс корпусу/);
	assert.match(homeHtml, /aria-label="Тип сутності"/);
	assert.match(homeHtml, /value="question"/);
	assert.match(homeHtml, />110<\/small>/);
	assert.match(homeHtml, /data-material-id="material\.from-body-to-signal"/);
	assert.match(homeHtml, /data-material-id="material\.why-documentation"/);

	assert.equal(research.status, 200);
	const researchHtml = await research.text();
	assert.match(researchHtml, /Від тіла до сигналу/);
	assert.match(researchHtml, /q\.channel-centrality/);
	assert.match(researchHtml, /10\.5281\/zenodo\.20647570/);

	assert.equal(programming.status, 200);
	const programmingHtml = await programming.text();
	assert.match(programmingHtml, /Why Documentation Matters/);
	assert.match(programmingHtml, /Corpus index/);
	assert.match(programmingHtml, /10\.5281\/zenodo\.20608559/);
	assert.doesNotMatch(programmingHtml, /Ordinary mode/);

	assert.equal(deepQuestion.status, 200);
	assert.match(await deepQuestion.text(), /AI companion/);

	assert.equal(api.status, 200);
	const payload = await api.json();
	assert.equal(payload.totalItems, 2);
	assert.ok(payload.items.every((item) => item.materialId.startsWith('material.')));
});
