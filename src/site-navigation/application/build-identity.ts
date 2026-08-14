import packageManifest from '../../../package.json';

export interface BuildIdentity {
	version: string;
	revision: string;
	label: string;
}

function resolveRevision(): string {
	const candidate =
		process.env.SITES_COMMIT_SHA ??
		process.env.CF_PAGES_COMMIT_SHA ??
		process.env.GITHUB_SHA ??
		process.env.VERCEL_GIT_COMMIT_SHA;

	return candidate?.slice(0, 8) ?? 'development';
}

export function getBuildIdentity(): BuildIdentity {
	const version = packageManifest.version;
	const revision = resolveRevision();

	return {
		version,
		revision,
		label: `v${version} · ${revision}`,
	};
}
