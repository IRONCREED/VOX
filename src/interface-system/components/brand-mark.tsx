import type { CSSProperties } from 'react';
import geometry from '../brand/iron-creed-mark.json';

export const BRAND_MARK_SRC = '/brand/iron-creed-mark.svg';
export const BRAND_FAVICON_SRC = '/favicon.svg';

type BrandMarkVariant = 'folder' | 'header' | 'loader';

interface BrandMarkProps {
	variant: BrandMarkVariant;
}

interface BrandMarkStyle extends CSSProperties {
	'--brand-baseline-stroke': number;
	'--brand-dark-ink': string;
	'--brand-dark-outline': string;
	'--brand-light-ink': string;
	'--brand-light-outline': string;
	'--brand-outline-stroke': number;
	'--brand-pulse-colour': string;
	'--brand-signal-stroke': number;
}

function PulseTrace({ path }: { path: string }) {
	return (
		<>
			<path className="brand-mark__trace brand-mark__trace--outline" d={path} pathLength="100" />
			<path className="brand-mark__trace brand-mark__trace--signal" d={path} pathLength="100" />
		</>
	);
}

export function BrandMark({ variant }: BrandMarkProps) {
	const classNames = `brand-mark brand-mark--${variant}`;
	const style: BrandMarkStyle = {
		'--brand-baseline-stroke': geometry.strokes.baseline,
		'--brand-dark-ink': geometry.colours.invertedInk,
		'--brand-dark-outline': geometry.colours.invertedOutline,
		'--brand-light-ink': geometry.colours.ink,
		'--brand-light-outline': geometry.colours.outline,
		'--brand-outline-stroke': geometry.strokes.outline,
		'--brand-pulse-colour': geometry.colours.pulse,
		'--brand-signal-stroke': geometry.strokes.signal,
	};

	return (
		<svg
			aria-hidden="true"
			className={classNames}
			data-brand-resource={BRAND_MARK_SRC}
			data-brand-state={geometry.state}
			focusable="false"
			style={style}
			viewBox={geometry.viewBox}
		>
			<path className="brand-mark__trident" d={geometry.tridentPath} />
			<g className="brand-mark__pulse">
				<path className="brand-mark__baseline" d={geometry.baselinePath} />
				<PulseTrace path={geometry.pulsePath} />
				{geometry.endpoints.map((endpoint) => (
					<circle
						className="brand-mark__endpoint"
						cx={endpoint.cx}
						cy={endpoint.cy}
						key={`${endpoint.cx}:${endpoint.cy}`}
						r={endpoint.r}
					/>
				))}
			</g>
		</svg>
	);
}
