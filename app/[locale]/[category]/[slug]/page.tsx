import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
	getAllPublishedRoutes,
	getArticleSeriesContext,
	getArticleByRoute,
	getArticleHref,
	getCategory,
	getCompanionScenario,
	getContextualHints,
	getInterfaceCopy,
	getNavigation,
	getTagsByIds,
	getTranslatedArticle,
} from '../../../../src/content-catalog/adapters/corpus-content-repository';
import { isLocale } from '../../../../src/content-catalog/domain/content-model';
import { ArticlePageTemplate } from '../../../../src/interface-system/templates/article-page-template';
import { getBuildIdentity } from '../../../../src/site-navigation/application/build-identity';
import { getSiteOrigin } from '../../../../src/site-metadata/site-origin';

interface ArticlePageProps {
	params: Promise<{ locale: string; category: string; slug: string }>;
}

export function generateStaticParams() {
	return getAllPublishedRoutes().map((article) => ({
		locale: article.locale,
		category: article.category,
		slug: article.slug,
	}));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
	const { locale, category, slug } = await params;
	if (!isLocale(locale)) {
		return {};
	}

	const article = getArticleByRoute(locale, category, slug);
	if (!article) {
		return {};
	}

	const origin = getSiteOrigin();
	const canonical = new URL(getArticleHref(article), origin);
	const ukArticle = locale === 'uk' ? article : getTranslatedArticle(article, 'uk');
	const enArticle = locale === 'en' ? article : getTranslatedArticle(article, 'en');
	const languages: Record<string, URL> = {};

	if (ukArticle) {
		languages.uk = new URL(getArticleHref(ukArticle), origin);
		languages['x-default'] = new URL(getArticleHref(ukArticle), origin);
	}
	if (enArticle) {
		languages.en = new URL(getArticleHref(enArticle), origin);
	}
	const title = `${article.title} — IRON CREED`;

	return {
		title,
		description: article.description,
		alternates: {
			canonical,
			languages,
		},
		openGraph: {
			title,
			description: article.description,
			images: [],
			type: 'article',
			url: canonical,
		},
		twitter: {
			card: 'summary',
			description: article.description,
			images: [],
			title,
		},
	};
}

export default async function ArticlePage({ params }: ArticlePageProps) {
	const { locale, category: categoryId, slug } = await params;
	if (!isLocale(locale)) {
		notFound();
	}

	const article = getArticleByRoute(locale, categoryId, slug);
	const category = getCategory(locale, categoryId);
	if (!article || !category) {
		notFound();
	}

	const otherLocale = locale === 'uk' ? 'en' : 'uk';
	const translatedArticle = getTranslatedArticle(article, otherLocale);
	const origin = getSiteOrigin();
	const articleUrl = new URL(getArticleHref(article), origin).toString();
	const resolvedTags = getTagsByIds(locale, article.tags);
	const authors: Array<{ displayName: string; url?: string }> =
		article.authorMetadata ?? article.authors.map((displayName) => ({ displayName }));
	const seriesContext = getArticleSeriesContext(article);
	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: article.title,
		description: article.description,
		datePublished: article.publishedAt,
		dateModified: article.updatedAt,
		contentRating: article.ageRestriction.rating,
		inLanguage: article.locale,
		mainEntityOfPage: articleUrl,
		keywords: resolvedTags.map((tag) => tag.label),
		author: authors.map((author) => ({
			'@type': 'Person',
			name: author.displayName,
			...(author.url ? { url: author.url } : {}),
		})),
		publisher: {
			'@type': 'Organization',
			name: 'Zhovten Games',
		},
		...(seriesContext
			? {
					isPartOf: {
						'@type': 'CollectionPage',
						name: seriesContext.series.title,
						url: new URL(`/${locale}/series/${seriesContext.series.slug}`, origin).toString(),
					},
					position: seriesContext.position,
				}
			: {}),
	};

	return (
		<>
			<script
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(structuredData).replaceAll('<', '\\u003c'),
				}}
				type="application/ld+json"
			/>
			<ArticlePageTemplate
				article={article}
				buildIdentity={getBuildIdentity()}
				category={category}
				companionScenario={getCompanionScenario(article.conversationViewId, locale)}
				copy={getInterfaceCopy(locale)}
				hints={getContextualHints(locale, article.hintIds)}
				locale={locale}
				navigation={getNavigation(locale, category.id)}
				resolvedTags={resolvedTags}
				seriesContext={seriesContext}
				translatedArticle={translatedArticle}
			/>
		</>
	);
}
