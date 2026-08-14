'use client';

import { useEffect, useRef, useState } from 'react';
import interfaceBehavior from '../../../content/config/interface-behavior.json';
import loaderQuotes from '../../../content/config/loader-quotes.json';
import { BRAND_MARK_SRC, BrandMark } from './brand-mark';

// Historical floors remain executable while the active values come from configuration.
const MINIMUM_VISIBLE_TIME = 2400;
const MAXIMUM_WAIT_TIME = 6000;
const LOADER_SESSION_KEY = 'ironcreed:loading-gate-seen';

interface LoadingGateProps {
	releaseId: string;
}

function waitForCriticalResources(): Promise<void> {
	const fontsReady = document.fonts?.ready ?? Promise.resolve();
	const brandReady = document.querySelector(
		`.loading-gate [data-brand-resource="${BRAND_MARK_SRC}"]`,
	)
		? Promise.resolve()
		: new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

	return Promise.all([fontsReady, brandReady]).then(() => undefined);
}

function chooseQuote(): string[] {
	const randomIndex = crypto.getRandomValues(new Uint32Array(1))[0] % loaderQuotes.length;
	return loaderQuotes[randomIndex];
}

export function LoadingGate({ releaseId }: LoadingGateProps) {
	const [isVisible, setIsVisible] = useState(true);
	const [isLeaving, setIsLeaving] = useState(false);
	const quoteRef = useRef<HTMLParagraphElement>(null);

	useEffect(() => {
		const minimumVisibleTime = Math.max(
			MINIMUM_VISIBLE_TIME,
			interfaceBehavior.loader.minimumVisibleMs,
		);
		const maximumWaitTime = Math.max(
			minimumVisibleTime,
			MAXIMUM_WAIT_TIME,
			interfaceBehavior.loader.maximumWaitMs,
		);
		const startedAt = performance.now();
		const sessionKey = `${LOADER_SESSION_KEY}:${releaseId}`;
		let hasAlreadyLoaded = false;

		try {
			hasAlreadyLoaded = sessionStorage.getItem(sessionKey) === 'true';
		} catch {
			hasAlreadyLoaded = false;
		}

		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		let isCancelled = false;

		const quoteElements = chooseQuote().map((line) => {
			const element = document.createElement('span');
			element.textContent = line;
			return element;
		});
		quoteRef.current?.replaceChildren(...quoteElements);

		const ready =
			hasAlreadyLoaded || reducedMotion
				? Promise.resolve()
				: Promise.race([
						waitForCriticalResources(),
						new Promise<void>((resolve) => {
							window.setTimeout(resolve, maximumWaitTime);
						}),
					]);

		void ready.then(() => {
			const elapsed = performance.now() - startedAt;
			const remaining =
				hasAlreadyLoaded || reducedMotion ? 0 : Math.max(0, minimumVisibleTime - elapsed);

			window.setTimeout(() => {
				if (isCancelled) {
					return;
				}

				try {
					sessionStorage.setItem(sessionKey, 'true');
				} catch {
					// Storage is optional; the current gate can still complete normally.
				}
				setIsLeaving(true);
				window.setTimeout(() => setIsVisible(false), interfaceBehavior.loader.exitTransitionMs);
			}, remaining);
		});

		return () => {
			isCancelled = true;
		};
	}, [releaseId]);

	if (!isVisible) {
		return null;
	}

	return (
		<div
			aria-label="IRON CREED"
			aria-live="polite"
			className={`loading-gate${isLeaving ? ' is-leaving' : ''}`}
			role="status"
		>
			<div className="loading-gate__core">
				<BrandMark variant="loader" />
				<strong>IRON CREED</strong>
				<p ref={quoteRef}>
					{loaderQuotes[0].map((line) => (
						<span key={line}>{line}</span>
					))}
				</p>
			</div>
		</div>
	);
}
