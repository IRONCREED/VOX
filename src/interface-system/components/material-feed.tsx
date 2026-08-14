'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type {
	ArticleSummary,
	InterfaceCopy,
	Locale,
	LocalizedTag,
	PaginatedArticles,
} from '../../content-catalog/domain/content-model';
import { MaterialCard } from './material-card';

interface MaterialFeedProps {
	activeTagId?: string;
	availableTags: LocalizedTag[];
	categoryId?: string;
	copy: InterfaceCopy;
	initialPage: PaginatedArticles;
	locale: Locale;
}

function pageHref(locale: Locale, categoryId: string | undefined, page: number, tagId?: string) {
	const pathname = categoryId ? `/${locale}/${categoryId}` : `/${locale}/`;
	const query = new URLSearchParams();
	if (tagId) {
		query.set('tag', tagId);
	}
	if (page > 1) {
		query.set('page', String(page));
	}
	return query.size > 0 ? `${pathname}?${query}` : pathname;
}

export function MaterialFeed({
	activeTagId,
	availableTags,
	categoryId,
	copy,
	initialPage,
	locale,
}: MaterialFeedProps) {
	const [items, setItems] = useState<ArticleSummary[]>(initialPage.items);
	const [currentPage, setCurrentPage] = useState(initialPage.page);
	const [isLoading, setIsLoading] = useState(false);
	const [hasError, setHasError] = useState(false);
	const [isEnhanced, setIsEnhanced] = useState(false);
	const hasNextPage = currentPage < initialPage.totalPages;
	const nextPage = currentPage + 1;
	const nextHref = pageHref(locale, categoryId, nextPage, activeTagId);

	useEffect(() => {
		const update = window.setTimeout(() => setIsEnhanced(true), 0);
		return () => window.clearTimeout(update);
	}, []);

	async function loadNextPage(event: React.MouseEvent<HTMLAnchorElement>) {
		if (!hasNextPage) {
			return;
		}

		event.preventDefault();
		setIsLoading(true);
		setHasError(false);

		const query = new URLSearchParams({
			locale,
			page: String(nextPage),
		});
		if (categoryId) {
			query.set('category', categoryId);
		}
		if (activeTagId) {
			query.set('tag', activeTagId);
		}

		try {
			const response = await fetch(`/api/materials?${query}`, {
				headers: { accept: 'application/json' },
			});
			if (!response.ok) {
				throw new Error(`Material endpoint returned ${response.status}.`);
			}

			const payload = (await response.json()) as PaginatedArticles;
			setItems((current) => {
				const knownIds = new Set(current.map((item) => item.id));
				return [...current, ...payload.items.filter((item) => !knownIds.has(item.id))];
			});
			setCurrentPage(payload.page);
			window.history.replaceState({}, '', pageHref(locale, categoryId, payload.page, activeTagId));
		} catch {
			setHasError(true);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<section aria-label={copy.latestMaterials} className="material-feed">
			{availableTags.length > 0 ? (
				<nav aria-label={copy.filterByTag} className="tag-filter">
					<span>{copy.filterByTag}</span>
					<div>
						<Link
							aria-current={!activeTagId ? 'page' : undefined}
							href={pageHref(locale, categoryId, 1)}
						>
							{copy.allTags}
						</Link>
						{availableTags.map((tag) => (
							<Link
								aria-current={tag.id === activeTagId ? 'page' : undefined}
								href={pageHref(locale, categoryId, 1, tag.id)}
								key={tag.id}
							>
								{tag.label}
							</Link>
						))}
					</div>
				</nav>
			) : null}

			<div className="material-list">
				{items.map((article) => (
					<MaterialCard
						article={article}
						key={article.id}
						latestPartLabel={copy.latestPart}
						openLabel={article.kind === 'series' ? copy.openSeries : copy.openMaterial}
						seriesLabel={copy.materialSeries}
					/>
				))}
			</div>

			<nav aria-label={copy.page} className="material-pagination">
				<div className="material-pagination__pages">
					{Array.from({ length: initialPage.totalPages }, (_, index) => index + 1).map((page) => (
						<Link
							aria-current={page === currentPage ? 'page' : undefined}
							href={pageHref(locale, categoryId, page, activeTagId)}
							key={page}
						>
							{String(page).padStart(2, '0')}
						</Link>
					))}
				</div>

				{hasNextPage ? (
					<Link aria-busy={isLoading} className="load-more" href={nextHref} onClick={loadNextPage}>
						<span>{isLoading ? copy.loading : copy.loadMore}</span>
						<i aria-hidden="true">{isEnhanced ? '↓' : '→'}</i>
					</Link>
				) : null}
			</nav>

			{hasError ? (
				<p className="material-feed__error" role="alert">
					{copy.loadError} <Link href={nextHref}>{copy.page} →</Link>
				</p>
			) : null}
		</section>
	);
}
