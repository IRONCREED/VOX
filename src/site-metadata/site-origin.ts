const FALLBACK_SITE_ORIGIN = 'https://web.zhovten.games';

export function getSiteOrigin(): URL {
	const configuredOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN;

	try {
		return new URL(configuredOrigin ?? FALLBACK_SITE_ORIGIN);
	} catch {
		return new URL(FALLBACK_SITE_ORIGIN);
	}
}
