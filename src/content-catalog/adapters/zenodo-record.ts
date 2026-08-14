import type { ZenodoPublication } from '../domain/content-model';

const ZENODO_ORIGIN = 'https://zenodo.org';

interface ZenodoFile {
	key?: unknown;
	size?: unknown;
	links?: {
		self?: unknown;
	};
}

interface ZenodoRecord {
	id?: unknown;
	files?: unknown;
}

export interface ResolvedZenodoPdf {
	downloadUrl: string;
	size: number | undefined;
}

export function getZenodoRecordUrl(recordId: string) {
	return `${ZENODO_ORIGIN}/records/${recordId}`;
}

export function getDoiUrl(doi: string) {
	if (!/^10\.\d{4,9}\/[A-Za-z0-9._;()/:+-]+$/.test(doi)) {
		throw new Error('The publication DOI is invalid.');
	}

	return `https://doi.org/${doi}`;
}

export function getZenodoApiUrl(recordId: string) {
	return `${ZENODO_ORIGIN}/api/records/${recordId}`;
}

export function resolveZenodoPdf(
	candidate: unknown,
	publication: ZenodoPublication,
): ResolvedZenodoPdf {
	if (!candidate || typeof candidate !== 'object') {
		throw new Error('Zenodo returned an invalid record.');
	}

	const record = candidate as ZenodoRecord;
	if (String(record.id) !== publication.recordId || !Array.isArray(record.files)) {
		throw new Error('Zenodo returned a different or incomplete record.');
	}

	const file = (record.files as ZenodoFile[]).find((entry) => entry.key === publication.pdfFile);
	if (!file || typeof file.links?.self !== 'string') {
		throw new Error('The declared PDF is absent from the Zenodo record.');
	}

	const downloadUrl = new URL(file.links.self);
	const expectedPrefix = `/api/records/${publication.recordId}/files/`;
	if (
		downloadUrl.protocol !== 'https:' ||
		downloadUrl.hostname !== 'zenodo.org' ||
		!downloadUrl.pathname.startsWith(expectedPrefix) ||
		!downloadUrl.pathname.endsWith('/content')
	) {
		throw new Error('Zenodo returned an unexpected PDF address.');
	}

	return {
		downloadUrl: downloadUrl.toString(),
		size: typeof file.size === 'number' && file.size >= 0 ? file.size : undefined,
	};
}
