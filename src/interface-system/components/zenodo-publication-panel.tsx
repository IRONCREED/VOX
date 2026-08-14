'use client';

import { useEffect, useRef, useState } from 'react';
import {
	getZenodoApiUrl,
	getDoiUrl,
	resolveZenodoPdf,
} from '../../content-catalog/adapters/zenodo-record';
import type { InterfaceCopy, ZenodoPublication } from '../../content-catalog/domain/content-model';

type PdfState = 'idle' | 'loading' | 'ready' | 'error';

export function ZenodoPublicationPanel({
	copy,
	publication,
}: {
	copy: InterfaceCopy;
	publication: ZenodoPublication;
}) {
	const [pdfState, setPdfState] = useState<PdfState>('idle');
	const [pdfUrl, setPdfUrl] = useState<string>();
	const abortRef = useRef<AbortController | undefined>(undefined);
	const objectUrlRef = useRef<string | undefined>(undefined);
	const recordUrl = getDoiUrl(publication.doi);

	function releasePdf() {
		abortRef.current?.abort();
		abortRef.current = undefined;

		if (objectUrlRef.current) {
			URL.revokeObjectURL(objectUrlRef.current);
			objectUrlRef.current = undefined;
		}

		setPdfUrl(undefined);
	}

	useEffect(() => {
		return () => {
			abortRef.current?.abort();
			if (objectUrlRef.current) {
				URL.revokeObjectURL(objectUrlRef.current);
			}
		};
	}, []);

	async function loadPdf() {
		releasePdf();
		const controller = new AbortController();
		abortRef.current = controller;
		setPdfState('loading');

		try {
			const metadataResponse = await fetch(getZenodoApiUrl(publication.recordId), {
				headers: { accept: 'application/json' },
				signal: controller.signal,
			});
			if (!metadataResponse.ok) {
				throw new Error(`Zenodo metadata request failed with ${metadataResponse.status}.`);
			}

			const resolvedPdf = resolveZenodoPdf(await metadataResponse.json(), publication);
			const pdfResponse = await fetch(resolvedPdf.downloadUrl, {
				headers: { accept: 'application/pdf' },
				signal: controller.signal,
			});
			if (!pdfResponse.ok) {
				throw new Error(`Zenodo PDF request failed with ${pdfResponse.status}.`);
			}

			const pdf = new Blob([await pdfResponse.arrayBuffer()], { type: 'application/pdf' });
			const nextUrl = URL.createObjectURL(pdf);
			if (controller.signal.aborted) {
				URL.revokeObjectURL(nextUrl);
				return;
			}

			objectUrlRef.current = nextUrl;
			setPdfUrl(nextUrl);
			setPdfState('ready');
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				return;
			}

			setPdfState('error');
		}
	}

	function closePdf() {
		releasePdf();
		setPdfState('idle');
	}

	return (
		<section
			aria-labelledby="zenodo-publication-title"
			className="zenodo-publication"
			id="zenodo-publication"
		>
			<header>
				<div>
					<small>ZENODO · {publication.doi}</small>
					<h2 id="zenodo-publication-title">{publication.title}</h2>
				</div>
				<a href={recordUrl} rel="noreferrer" target="_blank">
					{copy.openOnZenodo}
					<span aria-hidden="true">↗</span>
				</a>
			</header>

			<div className="zenodo-publication__controls">
				{pdfState === 'ready' ? (
					<button onClick={closePdf} type="button">
						{copy.closePdf}
					</button>
				) : (
					<button disabled={pdfState === 'loading'} onClick={loadPdf} type="button">
						{pdfState === 'loading' ? copy.loadingPdf : copy.loadPdf}
					</button>
				)}
				<span>{publication.pdfFile}</span>
			</div>

			{pdfState === 'ready' && pdfUrl ? (
				<object
					aria-label={`${publication.title} PDF`}
					className="zenodo-publication__viewer"
					data={pdfUrl}
					type="application/pdf"
				>
					<p>
						{copy.pdfFallback}{' '}
						<a href={recordUrl} rel="noreferrer" target="_blank">
							{copy.openOnZenodo}
						</a>
					</p>
				</object>
			) : null}

			{pdfState === 'error' ? (
				<p className="zenodo-publication__error" role="alert">
					{copy.pdfLoadError} {copy.pdfFallback}{' '}
					<a href={recordUrl} rel="noreferrer" target="_blank">
						{copy.openOnZenodo}
					</a>
				</p>
			) : null}
		</section>
	);
}
