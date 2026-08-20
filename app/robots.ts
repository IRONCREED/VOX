import type { MetadataRoute } from 'next';
import { getSiteOrigin } from '../src/site-metadata/site-origin';

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: '*',
			allow: '/',
		},
		sitemap: new URL('/sitemap.xml', getSiteOrigin()).href,
	};
}
