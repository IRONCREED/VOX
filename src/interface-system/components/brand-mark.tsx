/* eslint-disable @next/next/no-img-element -- the shared SVG must remain one directly decodable browser image for the loading gate */

export const BRAND_MARK_SRC = '/brand/iron-creed-mark.svg';
export const BRAND_FAVICON_SRC = '/favicon.svg';

type BrandMarkVariant = 'folder' | 'header' | 'loader';

interface BrandMarkProps {
	variant: BrandMarkVariant;
}

export function BrandMark({ variant }: BrandMarkProps) {
	return (
		<img
			alt=""
			aria-hidden="true"
			className={`brand-mark brand-mark--${variant}`}
			data-brand-resource={BRAND_MARK_SRC}
			data-brand-state="ic-faceted-monogram-2026"
			draggable="false"
			src={BRAND_MARK_SRC}
		/>
	);
}
