import Link from 'next/link';
import type {
	ArticleSummary,
	InterfaceCopy,
	Locale,
	LocalizedSeries,
	NavigationItem,
} from '../../content-catalog/domain/content-model';
import type { BuildIdentity } from '../../site-navigation/application/build-identity';
import { MaterialCard } from '../components/material-card';
import { QuipCollection } from '../components/quip-collection';
import { SiteShell } from './site-shell';

interface CategoryModel {
	id: string;
	label: string;
}

interface SeriesPageTemplateProps {
	buildIdentity: BuildIdentity;
	category: CategoryModel;
	copy: InterfaceCopy;
	locale: Locale;
	navigation: NavigationItem[];
	parts: ArticleSummary[];
	series: LocalizedSeries;
	translatedSeries?: LocalizedSeries;
}

export function SeriesPageTemplate({
	buildIdentity,
	category,
	copy,
	locale,
	navigation,
	parts,
	series,
	translatedSeries,
}: SeriesPageTemplateProps) {
	const otherLocale: Locale = locale === 'uk' ? 'en' : 'uk';
	const localeLinks = [
		{ locale, href: `/${locale}/series/${series.slug}`, direct: true },
		{
			locale: otherLocale,
			href: translatedSeries
				? `/${otherLocale}/series/${translatedSeries.slug}`
				: `/${otherLocale}/`,
			direct: Boolean(translatedSeries),
		},
	].toSorted((left, right) => (left.locale === 'uk' ? -1 : right.locale === 'uk' ? 1 : 0));

	return (
		<SiteShell
			buildIdentity={buildIdentity}
			copy={copy}
			locale={locale}
			localeLinks={localeLinks}
			navigation={navigation}
		>
			<main className="knowledge-panel knowledge-panel--listing series-page" id="main">
				<nav aria-label="Breadcrumb" className="article-route series-page__route">
					<Link aria-label={copy.back} href={`/${locale}/${category.id}`}>
						‹
					</Link>
					<Link href={`/${locale}/${category.id}`}>{category.label}</Link>
					<i>/</i>
					<span>{copy.materialSeries}</span>
				</nav>

				<header className="listing-introduction">
					<small>IRON CREED / MATERIAL SERIES</small>
					<h1>{series.title}</h1>
					<div className="title-rule" />
					<p>{series.description}</p>
				</header>

				<div className="listing-section-heading">
					<span>{copy.allParts}</span>
					<i />
					<small>{String(parts.length).padStart(2, '0')}</small>
				</div>

				<section aria-label={copy.allParts} className="material-list series-page__parts">
					{parts.map((article) => (
						<MaterialCard article={article} key={article.id} openLabel={copy.openMaterial} />
					))}
				</section>

				<QuipCollection locale={locale} nextLabel={copy.nextQuip} />
			</main>
		</SiteShell>
	);
}
