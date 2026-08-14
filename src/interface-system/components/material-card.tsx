import Link from 'next/link';
import type { ArticleSummary } from '../../content-catalog/domain/content-model';
import { ProtocolFolder } from './protocol-folder';

interface MaterialCardProps {
	article: ArticleSummary;
	openLabel: string;
	seriesLabel?: string;
	latestPartLabel?: string;
}

export function MaterialCard({
	article,
	latestPartLabel,
	openLabel,
	seriesLabel,
}: MaterialCardProps) {
	const isSeries = article.kind === 'series';
	const eyebrow = isSeries
		? `${seriesLabel ?? 'Series'} · ${article.partCount ?? 0}`
		: article.category;
	return (
		<article
			className={`material-card${isSeries ? ' material-card--series' : ''}`}
			data-catalog-id={article.seriesId ?? article.materialId}
		>
			<div className="material-card__copy">
				<small>{eyebrow}</small>
				<h2>
					<Link href={article.href}>{article.title}</Link>
				</h2>
				{isSeries && article.latestTitle ? (
					<strong className="material-card__latest">
						<span>{latestPartLabel}</span>
						{article.latestTitle}
					</strong>
				) : null}
				<p>{article.description}</p>
				<Link className="material-card__action" href={article.href}>
					<span>{openLabel}</span>
					<i aria-hidden="true">›</i>
				</Link>
			</div>
			<Link
				aria-label={`${openLabel}: ${article.title}`}
				className="material-card__folder"
				href={article.href}
			>
				<ProtocolFolder
					interactive
					label={article.folderLabel}
					sheets={article.folderSheets ?? 0}
				/>
			</Link>
		</article>
	);
}
