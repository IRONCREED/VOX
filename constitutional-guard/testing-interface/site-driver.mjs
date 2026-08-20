import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function projectRoot() {
	const configuredRoot = process.env.IRON_WARDEN_PROJECT_ROOT;
	if (!configuredRoot) {
		throw new Error('IRON_WARDEN_PROJECT_ROOT is required.');
	}

	return configuredRoot;
}

export async function readCanonicalJson(relativePath) {
	const source = await readFile(path.join(projectRoot(), relativePath), 'utf8');
	return JSON.parse(source);
}

export async function readCanonicalText(relativePath) {
	return readFile(path.join(projectRoot(), relativePath), 'utf8');
}

export async function createCompiledSiteDriver() {
	const workerPath = path.join(projectRoot(), 'dist/server/index.js');
	const workerUrl = pathToFileURL(workerPath);
	workerUrl.searchParams.set('iron-warden', `${process.pid}-${Date.now()}`);
	const { default: worker } = await import(workerUrl.href);

	if (!worker || typeof worker.fetch !== 'function') {
		throw new Error('The compiled site does not expose Worker default.fetch.');
	}

	return {
		request(pathname, init = {}) {
			return worker.fetch(
				new Request(new URL(pathname, 'https://ironcreed.test'), init),
				{
					ASSETS: {
						fetch: async () => new Response('Not found', { status: 404 }),
					},
					IMAGES: {
						input() {
							throw new Error('Image transformation is outside this test contract.');
						},
					},
				},
				{
					waitUntil() {},
					passThroughOnException() {},
				},
			);
		},
	};
}
