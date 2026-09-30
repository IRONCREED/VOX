import registry from '../../content/config/social-previews.json';
import { getSiteOrigin } from './site-origin';

export function getSocialPreview(entityId?: string) {
	const entities: Record<string, string> = registry.entities;
	const covers: Record<string, { src: string; width: number; height: number; alt: string }> =
		registry.covers;
	const cover = covers[(entityId && entities[entityId]) || registry.default];
	return {
		url: new URL(cover.src, getSiteOrigin()),
		width: cover.width,
		height: cover.height,
		alt: cover.alt,
		type: 'image/webp',
	};
}
