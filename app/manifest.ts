import type { MetadataRoute } from 'next';
import { BRAND_FAVICON_SRC } from '../src/interface-system/components/brand-mark';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'IRON CREED',
		short_name: 'IRON CREED',
		description: 'Architecture, memory, and formal systems inside software.',
		start_url: '/uk/',
		display: 'standalone',
		background_color: '#edf0ef',
		theme_color: '#edf0ef',
		orientation: 'any',
		icons: [
			{
				src: BRAND_FAVICON_SRC,
				sizes: 'any',
				type: 'image/svg+xml',
				purpose: 'any',
			},
			{
				src: BRAND_FAVICON_SRC,
				sizes: 'any',
				type: 'image/svg+xml',
				purpose: 'maskable',
			},
		],
	};
}
