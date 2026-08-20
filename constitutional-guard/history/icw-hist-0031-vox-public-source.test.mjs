import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = process.env.IRON_WARDEN_PROJECT_ROOT;
const readText = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

test('ICW-HIST-0031: release 1.2.0 establishes one fail-closed VOX source policy', async () => {
	const [pkg, acts, policy, profile, act] = await Promise.all([
		readJson('package.json'),
		readJson('governance/acts.json'),
		readJson('vox/publication-policy.json'),
		readText('governance/PROFILE.md'),
		readText('governance/legislation/VOX_PUBLIC_SOURCE_2026-08-14.md'),
	]);

	assert.equal(pkg.version, '1.2.0');
	assert.equal(pkg.scripts['vox:prepare'], 'node scripts/vox/prepare.mjs');
	assert.equal(pkg.scripts['vox:verify'], 'node scripts/vox/verify.mjs');
	assert.equal(pkg.scripts['vox:publish'], 'node scripts/vox/publish.mjs');
	assert.equal(policy.id, 'icw-vox-public-source-001');
	assert.deepEqual(policy.destination, {
		owner: 'IRONCREED',
		repository: 'VOX',
		branch: 'main',
	});
	assert.match(profile, /Редакция: `0\.6\.0`/);
	assert.match(act, /ICW-VX02\. Белый список/);
	assert.match(act, /ICW-VX06\. Доступ и секрет/);
	assert.match(act, /ICW-VX09\. Разделение внешних целей/);
	assert.equal(
		acts.acts.find((entry) => entry.id === 'icw-act-development-001')?.revision,
		'1.2.0',
	);
	assert.equal(
		acts.acts.find((entry) => entry.id === 'icw-act-semantic-core-001')?.revision,
		'1.4.0',
	);
	assert.equal(
		acts.acts.find((entry) => entry.id === 'icw-act-content-lifecycle-001')?.revision,
		'2.0.0',
	);
	assert.equal(
		acts.acts.find((entry) => entry.id === 'icw-act-vox-public-source-001')?.status,
		'active',
	);
});

test('ICW-HIST-0031: the policy separates public source from private control state', async () => {
	const [policy, prepare, verify, publish] = await Promise.all([
		readJson('vox/publication-policy.json'),
		readText('scripts/vox/prepare.mjs'),
		readText('scripts/vox/verify.mjs'),
		readText('scripts/vox/publish.mjs'),
	]);

	for (const prefix of [
		'governance/',
		'constitutional-guard/',
		'semantic-core/corpus/',
		'semantic-core/materials/',
		'semantic-core/dist/custom-gpt/',
		'scripts/vox/',
	]) {
		assert.ok(policy.forbiddenDestinationPrefixes.includes(prefix), prefix);
	}
	assert.ok(
		policy.files.some(
			(entry) =>
				entry.source === 'vox/public-source/.openai/hosting.json' &&
				entry.destination === '.openai/hosting.json',
		),
	);
	assert.match(prepare, /work\/vox-export/);
	assert.match(verify, /Public documentation must be English-only/);
	assert.match(verify, /Secret-shaped content/);
	assert.match(publish, /VOX_GITHUB_TOKEN/);
	assert.match(publish, /force: false/);
	assert.match(publish, /managed marker/);
});
