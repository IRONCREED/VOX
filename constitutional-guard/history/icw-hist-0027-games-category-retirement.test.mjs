import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = process.env.IRON_WARDEN_PROJECT_ROOT;
const readText = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

test('ICW-HIST-0027: release 1.0.0 retires games from the governed category registry', async () => {
	const [pkg, categories, acts, siteManifest, gptManifest, foundation, experience] =
		await Promise.all([
			readJson('package.json'),
			readJson('content/config/categories.json'),
			readJson('governance/acts.json'),
			readJson('semantic-core/dist/site/manifest.json'),
			readJson('semantic-core/dist/custom-gpt/manifest.json'),
			readText('governance/legislation/CONTENT_FOUNDATION_2026-08-02.md'),
			readText('governance/legislation/SITE_EXPERIENCE.md'),
		]);

	assert.equal(pkg.version, '1.0.0');
	assert.deepEqual(
		categories.map((category) => category.id),
		['programming', 'research', 'scenarios'],
	);
	assert.equal(
		categories.some((category) => category.id === 'games'),
		false,
	);
	assert.equal(siteManifest.contentVersion, '1.3.0');
	assert.equal(siteManifest.sourceCommit, gptManifest.sourceCommit);
	assert.equal(siteManifest.contentDigest, gptManifest.contentDigest);
	assert.equal(
		acts.acts.find((act) => act.id === 'icw-act-content-foundation-001')?.revision,
		'2.0.0',
	);
	assert.equal(
		acts.acts.find((act) => act.id === 'icw-act-site-experience-001')?.revision,
		'1.0.0',
	);
	assert.equal(acts.acts.find((act) => act.id === 'icw-act-development-001')?.revision, '1.0.0');
	assert.match(foundation, /Категория `games` упразднена/);
	assert.match(experience, /прежний пустой маршрут[\s\S]*`404`/);
});

test('ICW-HIST-0027: the category retirement has a complete release attestation', async () => {
	const attestation = await readJson(
		'governance/attestations/games-category-retirement-2026-08-13.json',
	);

	assert.equal(attestation.constitutionImpact.status, 'reviewed-no-change');
	assert.equal(attestation.profileImpact.status, 'reviewed-no-change');
	assert.equal(attestation.contentImpact.contentVersion, '1.3.0');
	assert.equal(attestation.contentImpact.changed, false);

	for (const document of attestation.documents) {
		const content = await readFile(path.join(projectRoot, document.path));
		assert.equal(createHash('sha256').update(content).digest('hex'), document.sha256);
	}
});
