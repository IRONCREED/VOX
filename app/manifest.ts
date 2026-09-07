import type { MetadataRoute } from 'next';
import { BRAND_FAVICON_SRC } from '../src/interface-system/components/brand-mark';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'IRON CREED',
		short_name: 'IRON CREED',
		description: 'Architecture, memory, and formal systems inside software.',
		start_url: '/uk/',
		display: 'standalone',
		background_color: '#fcfcfc',
		theme_color: '#fcfcfc',
		orientation: 'any',
		icons: [
			{
				src: BRAND_FAVICON_SRC,
				sizes: 'any',
				type: 'image/svg+xml',
				purpose: 'any',
			},
			{
				src: '/favicon-192.png?v=20260906',
				sizes: '192x192',
				type: 'image/png',
				purpose: 'any',
			},
			{
				src: '/favicon-512.png?v=20260906',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'any',
			},
		],
	};
}
