'use client';

import { useEffect, useId, useState } from 'react';
import type {
	ContextualHint as ContextualHintModel,
	HintSource,
} from '../../content-catalog/domain/content-model';

interface ContextualHintProps {
	closeLabel: string;
	hint: ContextualHintModel;
	prefix?: string;
	triggerLabel?: string;
	variant?: 'card' | 'inline';
}

const MAX_HINT_LENGTH = 2400;
const SIMPLE_SELECTOR = /^(#[A-Za-z][\w-]*|\.[A-Za-z][\w-]*)$/;
const ALLOWED_ELEMENTS = new Set(['STRONG', 'EM', 'CODE', 'BR', 'P', 'SPAN']);

function sanitizedMarkup(html: string): string {
	const documentModel = new DOMParser().parseFromString(html, 'text/html');
	const fragment = document.createDocumentFragment();

	function appendSafeNode(source: Node, target: Node) {
		if (source.nodeType === Node.TEXT_NODE) {
			target.appendChild(document.createTextNode(source.textContent ?? ''));
			return;
		}

		if (!(source instanceof HTMLElement) || !ALLOWED_ELEMENTS.has(source.tagName)) {
			for (const child of source.childNodes) {
				appendSafeNode(child, target);
			}
			return;
		}

		const safeElement = document.createElement(source.tagName.toLowerCase());
		for (const child of source.childNodes) {
			appendSafeNode(child, safeElement);
		}
		target.appendChild(safeElement);
	}

	for (const child of documentModel.body.childNodes) {
		appendSafeNode(child, fragment);
	}

	const container = document.createElement('div');
	container.appendChild(fragment);
	return container.innerHTML;
}

async function resolveHintSource(source: HintSource, signal: AbortSignal): Promise<string> {
	if (source.kind === 'text') {
		const container = document.createElement('span');
		for (const [index, paragraph] of source.text
			.slice(0, MAX_HINT_LENGTH)
			.split(/\n{2,}/)
			.entries()) {
			if (index > 0) {
				container.append(document.createElement('br'), document.createElement('br'));
			}
			container.append(document.createTextNode(paragraph.trim()));
		}
		return container.innerHTML;
	}

	if (source.kind === 'html') {
		return sanitizedMarkup(source.html.slice(0, MAX_HINT_LENGTH));
	}

	if (source.kind === 'content-fragment') {
		const target = document.querySelector<HTMLElement>(`#${CSS.escape(source.anchor)}`);
		if (!target) {
			throw new Error(`Local fragment "${source.anchor}" was not found.`);
		}

		return sanitizedMarkup(target.innerHTML.slice(0, MAX_HINT_LENGTH));
	}

	if (!SIMPLE_SELECTOR.test(source.selector)) {
		throw new Error('The hint selector is outside the accepted id/class form.');
	}

	const url = new URL(source.url, window.location.href);
	if (url.origin !== window.location.origin) {
		throw new Error('The hint URL is outside the current origin allowlist.');
	}

	const response = await fetch(url, {
		headers: { accept: 'text/html' },
		signal,
	});
	if (!response.ok) {
		throw new Error(`The hint source returned ${response.status}.`);
	}

	const text = (await response.text()).slice(0, 120_000);
	const sourceDocument = new DOMParser().parseFromString(text, 'text/html');
	const target = sourceDocument.querySelector<HTMLElement>(source.selector);
	if (!target) {
		throw new Error(`The hint target "${source.selector}" was not found.`);
	}

	return sanitizedMarkup(target.innerHTML.slice(0, MAX_HINT_LENGTH));
}

export function ContextualHint({
	closeLabel,
	hint,
	prefix,
	triggerLabel,
	variant = 'card',
}: ContextualHintProps) {
	const panelId = useId();
	const [isOpen, setIsOpen] = useState(false);
	const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
	const [resolvedHtml, setResolvedHtml] = useState('');

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const controller = new AbortController();
		const timeout = window.setTimeout(() => controller.abort(), 2500);

		void resolveHintSource(hint.source, controller.signal)
			.then((html) => {
				setResolvedHtml(html);
				setStatus('ready');
			})
			.catch(() => {
				setResolvedHtml(
					sanitizedMarkup(
						hint.locale === 'uk'
							? 'Фрагмент тимчасово недоступний.'
							: 'The fragment is temporarily unavailable.',
					),
				);
				setStatus('error');
			})
			.finally(() => window.clearTimeout(timeout));

		return () => {
			controller.abort();
			window.clearTimeout(timeout);
		};
	}, [hint, isOpen]);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		function closeOnEscape(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				setIsOpen(false);
			}
		}

		window.addEventListener('keydown', closeOnEscape);
		return () => window.removeEventListener('keydown', closeOnEscape);
	}, [isOpen]);

	return (
		<span className={`contextual-hint contextual-hint--${variant}${isOpen ? ' is-open' : ''}`}>
			<button
				aria-controls={panelId}
				aria-expanded={isOpen}
				aria-label={variant === 'inline' ? hint.label : undefined}
				onClick={() => {
					if (!isOpen && status !== 'ready') {
						setStatus('loading');
					}
					setIsOpen((current) => !current);
				}}
				type="button"
			>
				{variant === 'card' && prefix ? <span>{prefix}</span> : null}
				<strong>{triggerLabel ?? hint.label}</strong>
			</button>
			{isOpen ? (
				<span aria-label={hint.label} className="contextual-hint__panel" id={panelId} role="note">
					<button
						aria-label={closeLabel}
						className="contextual-hint__close"
						onClick={() => setIsOpen(false)}
						type="button"
					>
						×
					</button>
					{status === 'loading' ? (
						<span aria-live="polite" className="contextual-hint__content">
							…
						</span>
					) : (
						<span
							aria-live="polite"
							className="contextual-hint__content"
							dangerouslySetInnerHTML={{ __html: resolvedHtml }}
						/>
					)}
				</span>
			) : null}
		</span>
	);
}
