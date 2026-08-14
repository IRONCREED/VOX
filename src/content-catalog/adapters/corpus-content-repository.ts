import categoriesSource from '../../../content/config/categories.json';
import hintsSource from '../../../content/config/hints.json';
import interfaceSource from '../../../content/config/interface.json';
import navigationSource from '../../../content/config/navigation.json';
import entitiesSource from '../../../semantic-core/dist/site/entities.json';
import manifestSource from '../../../semantic-core/dist/site/manifest.json';
import materialsSource from '../../../semantic-core/dist/site/materials.json';
import pagesSource from '../../../semantic-core/dist/site/pages.json';
import questionsSource from '../../../semantic-core/dist/site/questions.json';
import seriesSource from '../../../semantic-core/dist/site/series.json';
import tagsSource from '../../../semantic-core/dist/site/tags.json';
import viewsSource from '../../../semantic-core/dist/site/views.json';
import {
	type ArticleSummary,
	type ArticleSeriesContext,
	type CatalogQuery,
	type CategoryDefinition,
	type CompanionEdge,
	type CompanionMotion,
	type CompanionScenario,
	type ContextualHint,
	type InterfaceCopy,
	type Locale,
	type LocalizedArticle,
	type LocalizedContentPage,
	type LocalizedSeries,
	type LocalizedTag,
	type NavigationItem,
	type PaginatedArticles,
	type PublicEntityIndexEntry,
	SUPPORTED_LOCALES,
	type SystemNavigationDefinition,
	type TagDefinition,
} from '../domain/content-model';

interface LocalizedText {
	uk: string;
	en: string;
}

interface CorpusQuestion {
	id: string;
	status: string;
	visibility: string;
	text: LocalizedText;
	answer: LocalizedText;
	answerContract?: { shape: string; mustAddress: string[] };
	presentation?: { motion?: CompanionMotion };
}

interface CorpusView {
	id: string;
	status: string;
	visibility: string;
	invitation: LocalizedText;
	entryQuestionIds: string[];
	nodes: string[];
	edges: Array<{ from: string; to: string; type: string; order: number }>;
}

export interface CorpusManifest {
	corpusId: string;
	schemaVersion: number;
	contentVersion: string;
	sourceCommit: string;
	contentDigest: string;
	target: 'site';
}

const PAGE_SIZE = 2;
const categories = (categoriesSource as CategoryDefinition[]).toSorted(
	(left, right) => left.order - right.order,
);
const tags = (tagsSource as TagDefinition[]).toSorted((left, right) => left.order - right.order);
const systemNavigation = (navigationSource as SystemNavigationDefinition[]).toSorted(
	(left, right) => left.order - right.order,
);
const articles = (materialsSource as LocalizedArticle[]).toSorted(
	(left, right) =>
		Date.parse(right.publishedAt) - Date.parse(left.publishedAt) ||
		left.title.localeCompare(right.title),
);
const materialSeries = (seriesSource as LocalizedSeries[]).toSorted(
	(left, right) =>
		Date.parse(right.updatedAt) - Date.parse(left.updatedAt) ||
		left.title.localeCompare(right.title),
);
const contentPages = (pagesSource as LocalizedContentPage[]).toSorted((left, right) =>
	left.pageId.localeCompare(right.pageId),
);
const questions = questionsSource as CorpusQuestion[];
const views = viewsSource as CorpusView[];
const entities = entitiesSource as PublicEntityIndexEntry[];
const manifest = manifestSource as CorpusManifest;

function assertProjection(): void {
	if (
		manifest.corpusId !== 'corpus.ironcreed' ||
		manifest.target !== 'site' ||
		!manifest.contentDigest ||
		!/^[0-9a-f]{7,40}$/i.test(manifest.sourceCommit)
	) {
		throw new Error('The corpus site projection has an invalid release manifest.');
	}

	const categoryIds = new Set(categories.map((category) => category.id));
	const tagIds = new Set(tags.map((tag) => tag.id));
	const questionIds = new Set(questions.map((question) => question.id));
	const viewIds = new Set(views.map((view) => view.id));
	const routeIds = new Set<string>();
	const pageIds = new Set(contentPages.map((page) => page.pageId));
	const materialIds = new Set(articles.map((article) => article.materialId));
	const seriesIds = new Set(materialSeries.map((series) => series.seriesId));

	for (const series of materialSeries) {
		const routeId = `${series.locale}/series/${series.slug}`;
		if (routeIds.has(routeId)) throw new Error(`Duplicate series route "${routeId}".`);
		routeIds.add(routeId);
		if (!categoryIds.has(series.category)) {
			throw new Error(`Series "${series.seriesId}" references an unknown category.`);
		}
		for (const tagId of series.tags) {
			if (!tagIds.has(tagId)) throw new Error(`Series "${series.seriesId}" has unknown tag.`);
		}
		for (const materialId of series.materialIds) {
			if (!materialIds.has(materialId)) {
				throw new Error(`Series "${series.seriesId}" references an unknown material.`);
			}
		}
	}

	for (const article of articles) {
		const routeId = `${article.locale}/${article.category}/${article.slug}`;
		if (routeIds.has(routeId)) throw new Error(`Duplicate corpus route "${routeId}".`);
		routeIds.add(routeId);
		if (!categoryIds.has(article.category)) {
			throw new Error(`Material "${article.materialId}" references an unknown category.`);
		}
		if (!viewIds.has(article.conversationViewId)) {
			throw new Error(`Material "${article.materialId}" references an unknown view.`);
		}
		for (const tagId of article.tags) {
			if (!tagIds.has(tagId)) throw new Error(`Material "${article.materialId}" has unknown tag.`);
		}
		if (article.series) {
			const series = materialSeries.find(
				(candidate) =>
					candidate.locale === article.locale && candidate.seriesId === article.series?.seriesId,
			);
			if (!series || !seriesIds.has(article.series.seriesId)) {
				throw new Error(`Material "${article.materialId}" references an unknown series.`);
			}
			if (series.materialIds[article.series.position - 1] !== article.materialId) {
				throw new Error(`Material "${article.materialId}" has an inconsistent series position.`);
			}
		}
	}

	for (const page of contentPages) {
		const routeId = `${page.locale}/pages/${page.slug}`;
		if (routeIds.has(routeId)) throw new Error(`Duplicate content-page route "${routeId}".`);
		routeIds.add(routeId);
		if (page.conversationViewId && !viewIds.has(page.conversationViewId)) {
			throw new Error(`Page "${page.pageId}" references an unknown view.`);
		}
	}

	for (const item of systemNavigation) {
		if (item.kind === 'page' && (!item.pageId || !pageIds.has(item.pageId))) {
			throw new Error(`Navigation item "${item.id}" references an unknown page.`);
		}
	}

	for (const view of views) {
		for (const id of [...view.entryQuestionIds, ...view.nodes]) {
			if (!questionIds.has(id)) throw new Error(`View "${view.id}" references unknown question.`);
		}
		for (const edge of view.edges) {
			if (!view.nodes.includes(edge.from) || !view.nodes.includes(edge.to)) {
				throw new Error(`View "${view.id}" contains an edge outside its node set.`);
			}
		}
	}
}

assertProjection();

export function getCorpusManifest(): CorpusManifest {
	return manifest;
}

export function getInterfaceCopy(locale: Locale): InterfaceCopy {
	return interfaceSource[locale] as InterfaceCopy;
}

export function getCategories(locale: Locale) {
	return categories.map((category) => ({
		id: category.id,
		order: category.order,
		icon: category.icon,
		label: category.labels[locale],
		description: category.descriptions[locale],
	}));
}

export function getCategory(locale: Locale, categoryId: string) {
	return getCategories(locale).find((category) => category.id === categoryId);
}

export function isCategoryId(value: string): boolean {
	return categories.some((category) => category.id === value);
}

export function isTagId(value: string): boolean {
	return tags.some((tag) => tag.id === value);
}

export function getTag(locale: Locale, tagId: string): LocalizedTag | undefined {
	const tag = tags.find((candidate) => candidate.id === tagId);
	return tag ? { id: tag.id, label: tag.labels[locale] } : undefined;
}

export function getTagsByIds(locale: Locale, tagIds: string[]): LocalizedTag[] {
	return tagIds
		.map((tagId) => getTag(locale, tagId))
		.filter((tag): tag is LocalizedTag => Boolean(tag));
}

// The public query intentionally remains one-tag-at-a-time. The corpus keeps the
// canonical tag graph independent from this interface policy.
export function getPublishedArticles(locale: Locale, query: CatalogQuery = {}): LocalizedArticle[] {
	return articles.filter(
		(article) =>
			article.locale === locale &&
			article.status === 'published' &&
			(!query.categoryId || article.category === query.categoryId) &&
			(!query.tagId || article.tags.includes(query.tagId)),
	);
}

export function getPublishedSeries(locale: Locale, query: CatalogQuery = {}): LocalizedSeries[] {
	const tagId = query.tagId;
	return materialSeries.filter(
		(series) =>
			series.locale === locale &&
			series.status === 'published' &&
			(!query.categoryId || series.category === query.categoryId) &&
			(!tagId ||
				series.tags.includes(tagId) ||
				getSeriesParts(series).some((article) => article.tags.includes(tagId))),
	);
}

export function getSeriesByRoute(locale: Locale, slug: string): LocalizedSeries | undefined {
	return getPublishedSeries(locale).find((series) => series.slug === slug);
}

export function getSeriesById(locale: Locale, seriesId: string): LocalizedSeries | undefined {
	return getPublishedSeries(locale).find((series) => series.seriesId === seriesId);
}

export function getTranslatedSeries(
	series: LocalizedSeries,
	locale: Locale,
): LocalizedSeries | undefined {
	return getPublishedSeries(locale).find(
		(candidate) => candidate.translationKey === series.translationKey,
	);
}

export function getSeriesHref(series: Pick<LocalizedSeries, 'locale' | 'slug'>) {
	return `/${series.locale}/series/${series.slug}`;
}

export function getSeriesParts(series: LocalizedSeries): LocalizedArticle[] {
	const byId = new Map(
		getPublishedArticles(series.locale).map((article) => [article.materialId, article]),
	);
	return series.materialIds
		.map((materialId) => byId.get(materialId))
		.filter((article): article is LocalizedArticle => Boolean(article));
}

export function getArticleSeriesContext(
	article: LocalizedArticle,
): ArticleSeriesContext | undefined {
	if (!article.series) return undefined;
	const series = getSeriesById(article.locale, article.series.seriesId);
	if (!series) return undefined;
	const parts = getSeriesParts(series);
	const index = parts.findIndex((candidate) => candidate.materialId === article.materialId);
	if (index < 0) return undefined;
	return {
		series,
		position: index + 1,
		total: parts.length,
		previous: index > 0 ? toArticleSummary(parts[index - 1]) : undefined,
		next: index < parts.length - 1 ? toArticleSummary(parts[index + 1]) : undefined,
	};
}

export function getAvailableTags(locale: Locale, categoryId?: string): LocalizedTag[] {
	const usedTagIds = new Set(
		getPublishedCatalogEntries(locale, { categoryId }).flatMap((entry) => entry.tags),
	);
	return tags
		.filter((tag) => usedTagIds.has(tag.id))
		.map((tag) => ({ id: tag.id, label: tag.labels[locale] }));
}

export function getArticleByRoute(
	locale: Locale,
	categoryId: string,
	slug: string,
): LocalizedArticle | undefined {
	return getPublishedArticles(locale, { categoryId }).find((article) => article.slug === slug);
}

export function getArticleById(contentId: string): LocalizedArticle | undefined {
	return articles.find((article) => article.id === contentId);
}

export function getTranslatedArticle(
	article: LocalizedArticle,
	locale: Locale,
): LocalizedArticle | undefined {
	return getPublishedArticles(locale).find(
		(candidate) => candidate.translationKey === article.translationKey,
	);
}

export function getArticleHref(article: Pick<LocalizedArticle, 'locale' | 'category' | 'slug'>) {
	return `/${article.locale}/${article.category}/${article.slug}`;
}

export function getPublishedContentPages(locale: Locale): LocalizedContentPage[] {
	return contentPages.filter((page) => page.locale === locale && page.status === 'published');
}

export function getContentPageByRoute(
	locale: Locale,
	slug: string,
): LocalizedContentPage | undefined {
	return getPublishedContentPages(locale).find((page) => page.slug === slug);
}

export function getContentPageById(
	locale: Locale,
	pageId: string,
): LocalizedContentPage | undefined {
	return getPublishedContentPages(locale).find((page) => page.pageId === pageId);
}

export function getTranslatedContentPage(
	page: LocalizedContentPage,
	locale: Locale,
): LocalizedContentPage | undefined {
	return getContentPageById(locale, page.pageId);
}

export function getContentPageHref(page: Pick<LocalizedContentPage, 'locale' | 'slug'>) {
	return `/${page.locale}/pages/${page.slug}`;
}

export function getAllPublishedPageRoutes(): LocalizedContentPage[] {
	return contentPages.filter((page) => page.status === 'published');
}

export function getPolicyPages(locale: Locale): LocalizedContentPage[] {
	return getPublishedContentPages(locale).filter((page) => page.pageType === 'policy');
}

export function toArticleSummary(article: LocalizedArticle): ArticleSummary {
	return {
		id: article.id,
		kind: 'material',
		materialId: article.materialId,
		translationKey: article.translationKey,
		title: article.title,
		description: article.description,
		folderLabel: article.folderLabel,
		category: article.category,
		tags: article.tags,
		href: getArticleHref(article),
		publishedAt: article.publishedAt,
	};
}

export function toSeriesSummary(series: LocalizedSeries): ArticleSummary {
	const tags = new Set([
		...series.tags,
		...getSeriesParts(series).flatMap((article) => article.tags),
	]);
	return {
		id: series.id,
		kind: 'series',
		seriesId: series.seriesId,
		translationKey: series.translationKey,
		title: series.title,
		description: series.latestDescription,
		folderLabel: series.folderLabel,
		category: series.category,
		tags: [...tags],
		href: getSeriesHref(series),
		publishedAt: series.updatedAt,
		folderSheets: series.folderSheets,
		latestTitle: series.latestTitle,
		partCount: series.materialIds.length,
	};
}

export function getPublishedCatalogEntries(
	locale: Locale,
	query: CatalogQuery = {},
): ArticleSummary[] {
	const groupedMaterialIds = new Set(
		getPublishedSeries(locale).flatMap((series) => series.materialIds),
	);
	const standalone = getPublishedArticles(locale, query)
		.filter((article) => !groupedMaterialIds.has(article.materialId))
		.map(toArticleSummary);
	const series = getPublishedSeries(locale, query).map(toSeriesSummary);
	return [...standalone, ...series].toSorted(
		(left, right) =>
			Date.parse(right.publishedAt) - Date.parse(left.publishedAt) ||
			left.title.localeCompare(right.title),
	);
}

export function paginateArticles(
	locale: Locale,
	query: CatalogQuery,
	requestedPage: number,
): PaginatedArticles {
	const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
	const source = getPublishedCatalogEntries(locale, query);
	const totalPages = Math.max(1, Math.ceil(source.length / PAGE_SIZE));
	const safePage = Math.min(page, totalPages);
	const offset = (safePage - 1) * PAGE_SIZE;
	return {
		items: source.slice(offset, offset + PAGE_SIZE),
		page: safePage,
		pageSize: PAGE_SIZE,
		totalItems: source.length,
		totalPages,
	};
}

export function getNavigation(
	locale: Locale,
	activeCategory?: string,
	isHome = false,
	activePageId?: string,
): NavigationItem[] {
	const categoryItems = getCategories(locale).map((category) => ({
		id: category.id,
		order: category.order,
		icon: category.icon,
		label: category.label,
		href: `/${locale}/${category.id}`,
		active: category.id === activeCategory,
		disabled: false,
		badge: undefined as string | undefined,
	}));
	const systemItems = systemNavigation.map((item) => {
		const page = item.pageId ? getContentPageById(locale, item.pageId) : undefined;
		return {
			id: item.id,
			order: item.order,
			icon: item.icon,
			label: item.labels[locale],
			href:
				item.kind === 'home'
					? `/${locale}/`
					: item.kind === 'page' && page
						? getContentPageHref(page)
						: undefined,
			active:
				(item.kind === 'home' && isHome) || (item.kind === 'page' && item.pageId === activePageId),
			disabled: item.kind === 'disabled',
			badge: item.badges?.[locale],
		};
	});
	return [...systemItems, ...categoryItems]
		.toSorted((left, right) => left.order - right.order)
		.map((item) => ({
			id: item.id,
			icon: item.icon,
			label: item.label,
			href: item.href,
			active: item.active,
			disabled: item.disabled,
			badge: item.badge,
		}));
}

export function getCompanionScenario(viewId: string, locale: Locale): CompanionScenario {
	const view = views.find(
		(candidate) =>
			candidate.id === viewId &&
			candidate.status === 'published' &&
			candidate.visibility === 'public',
	);
	if (!view) throw new Error(`Unknown public corpus view "${viewId}".`);
	const byId = new Map(questions.map((question) => [question.id, question]));
	return {
		invitation: view.invitation[locale],
		entryQuestionIds: view.entryQuestionIds,
		questions: view.nodes.map((id) => {
			const question = byId.get(id);
			if (!question) throw new Error(`View "${viewId}" references unknown question "${id}".`);
			return {
				id: question.id,
				label: question.text[locale],
				answer: question.answer[locale],
				motion: question.presentation?.motion ?? 'trace',
				answerContract: question.answerContract,
			};
		}),
		edges: view.edges as CompanionEdge[],
	};
}

export function getPublicEntityIndex(locale: Locale): PublicEntityIndexEntry[] {
	return entities.filter((entity) => entity.locale === locale);
}

export function getContextualHints(locale: Locale, hintIds: string[]): ContextualHint[] {
	const catalog = hintsSource as ContextualHint[];
	return hintIds
		.map((hintId) => catalog.find((hint) => hint.id === hintId && hint.locale === locale))
		.filter((hint): hint is ContextualHint => Boolean(hint));
}

export function getAllPublishedRoutes(): LocalizedArticle[] {
	return articles.filter((article) => article.status === 'published');
}

export function getAllPublishedSeriesRoutes(): LocalizedSeries[] {
	return materialSeries.filter((series) => series.status === 'published');
}

export { SUPPORTED_LOCALES };
