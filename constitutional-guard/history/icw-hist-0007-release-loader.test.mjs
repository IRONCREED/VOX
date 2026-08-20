import assert from 'node:assert/strict';
import test from 'node:test';
import { readCanonicalText } from '../testing-interface/site-driver.mjs';

test('ICW-HIST-0007: each release earns one loading ritual per session', async () => {
	const [loader, shell] = await Promise.all([
		readCanonicalText('src/interface-system/components/loading-gate.tsx'),
		readCanonicalText('src/interface-system/templates/site-shell.tsx'),
	]);

	assert.match(loader, /interface LoadingGateProps/);
	assert.match(loader, /releaseId: string/);
	assert.match(loader, /`\$\{LOADER_SESSION_KEY\}:\$\{releaseId\}`/);
	assert.match(loader, /sessionStorage\.getItem\(sessionKey\)/);
	assert.match(loader, /sessionStorage\.setItem\(sessionKey, 'true'\)/);
	assert.match(loader, /\[releaseId\]/);
	assert.match(shell, /<LoadingGate releaseId=\{buildIdentity\.label\} \/>/);
});
