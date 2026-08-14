'use client';

import { useState } from 'react';
import quipsSource from '../../../content/config/quips.json';
import type { Locale } from '../../content-catalog/domain/content-model';

interface QuipCollectionProps {
	locale: Locale;
	nextLabel: string;
}

interface Quip {
	prompt: string;
	reply: string;
}

export function QuipCollection({ locale, nextLabel }: QuipCollectionProps) {
	const quips = quipsSource[locale] as Quip[];
	const [activeIndex, setActiveIndex] = useState(0);
	const active = quips[activeIndex];

	return (
		<footer className="knowledge-footer knowledge-footer--quips">
			<div aria-live="polite" className="quip-copy">
				<p>{active.prompt}</p>
				<p>{active.reply}</p>
			</div>
			<button
				aria-label={nextLabel}
				onClick={() => setActiveIndex((current) => (current + 1) % quips.length)}
				title={nextLabel}
				type="button"
			>
				<span>{String(activeIndex + 1).padStart(2, '0')}</span>
				<i aria-hidden="true">→</i>
			</button>
		</footer>
	);
}
