import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
	getAllPublishedSeriesRoutes,
	getCategory,
	getInterfaceCopy,
	getNavigation,
	getSeriesByRoute,
	getSeriesHref,
	getSeriesParts,
	getTranslatedSeries,
	toArticleSummary,
} from '../../../../src/content-catalog/adapters/corpus-content-repository';
import { isLocale } from '../../../../src/content-catalog/domain/content-model';
import { SeriesPageTemplate } from '../../../../src/interface-system/templates/series-page-template';
import { getSiteOrigin } from '../../../../src/site-metadata/site-origin';
import { getBuildIdentity } from '../../../../src/site-navigation/application/build-identity';

interface SeriesPageProps {
	params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
	return getAllPublishedSeriesRoutes().map((series) => ({
		locale: series.locale,
		slug: series.slug,
	}));
}

export async function generateMetadata({ params }: SeriesPageProps): Promise<Metadata> {
	const { locale, slug } = await params;
	if (!isLocale(locale)) return {};
	const series = getSeriesByRoute(locale, slug);
	if (!series) return {};

	const origin = getSiteOrigin();
	const canonical = new URL(getSeriesHref(series), origin);
	const ukSeries = locale === 'uk' ? series : getTranslatedSeries(series, 'uk');
	const enSeries = locale === 'en' ? series : getTranslatedSeries(series, 'en');
	const languages: Record<string, URL> = {};
	if (ukSeries) {
		languages.uk = new URL(getSeriesHref(ukSeries), origin);
		languages['x-default'] = new URL(getSeriesHref(ukSeries), origin);
	}
	if (enSeries) languages.en = new URL(getSeriesHref(enSeries), origin);
	const title = `${series.title} — IRON CREED`;

	return {
		title,
		description: series.description,
		alternates: { canonical, languages },
		openGraph: {
			title,
			description: series.description,
			images: [],
			type: 'website',
			url: canonical,
		},
		twitter: {
			card: 'summary',
			description: series.description,
			images: [],
			title,
		},
	};
}

export default async function SeriesPage({ params }: SeriesPageProps) {
	const { locale, slug } = await params;
	if (!isLocale(locale)) notFound();
	const series = getSeriesByRoute(locale, slug);
	if (!series) notFound();
	const category = getCategory(locale, series.category);
	if (!category) notFound();
	const parts = getSeriesParts(series);
	const otherLocale = locale === 'uk' ? 'en' : 'uk';
	const translatedSeries = getTranslatedSeries(series, otherLocale);
	const origin = getSiteOrigin();
	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: series.title,
		description: series.description,
		url: new URL(getSeriesHref(series), origin).toString(),
		inLanguage: series.locale,
		hasPart: parts.map((article, index) => ({
			'@type': 'Article',
			position: index + 1,
			name: article.title,
			url: new URL(`/${article.locale}/${article.category}/${article.slug}`, origin).toString(),
		})),
	};

	return (
		<>
			<script
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(structuredData).replaceAll('<', '\\u003c'),
				}}
				type="application/ld+json"
			/>
			<SeriesPageTemplate
				buildIdentity={getBuildIdentity()}
				category={category}
				copy={getInterfaceCopy(locale)}
				locale={locale}
				navigation={getNavigation(locale, category.id)}
				parts={parts.map(toArticleSummary)}
				series={series}
				translatedSeries={translatedSeries}
			/>
		</>
	);
}
