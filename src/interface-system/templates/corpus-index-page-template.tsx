import Link from 'next/link';
import type {
	InterfaceCopy,
	Locale,
	LocalizedContentPage,
	NavigationItem,
	PublicEntityIndexEntry,
} from '../../content-catalog/domain/content-model';
import type { BuildIdentity } from '../../site-navigation/application/build-identity';
import { ArticleBody } from '../components/article-body';
import { EntityIndexTree } from '../components/entity-index-tree';
import { QuipCollection } from '../components/quip-collection';
import { SiteShell } from './site-shell';

interface CorpusIndexPageTemplateProps {
	buildIdentity: BuildIdentity;
	copy: InterfaceCopy;
	entities: PublicEntityIndexEntry[];
	locale: Locale;
	navigation: NavigationItem[];
	page: LocalizedContentPage;
	pages: LocalizedContentPage[];
	translatedPage?: LocalizedContentPage;
}

export function CorpusIndexPageTemplate({
	buildIdentity,
	copy,
	entities,
	locale,
	navigation,
	page,
	pages,
	translatedPage,
}: CorpusIndexPageTemplateProps) {
	const otherLocale: Locale = locale === 'uk' ? 'en' : 'uk';
	const localeLinks = [
		{ locale, href: `/${locale}/pages/${page.slug}`, direct: true },
		{
			locale: otherLocale,
			href: translatedPage ? `/${otherLocale}/pages/${translatedPage.slug}` : `/${otherLocale}/`,
			direct: Boolean(translatedPage),
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
			<main className="knowledge-panel knowledge-panel--content-page corpus-index-page" id="main">
				<header className="content-page-header">
					<small>{page.eyebrow}</small>
					<h1>{page.title}</h1>
					<div className="title-rule" />
					<p>{page.description}</p>
				</header>

				<section aria-labelledby="page-directory-title" className="page-directory">
					<h2 id="page-directory-title">{copy.pageDirectory}</h2>
					<ul>
						{pages.map((listedPage) => (
							<li key={listedPage.pageId}>
								<Link
									aria-current={listedPage.pageId === page.pageId ? 'page' : undefined}
									href={`/${locale}/pages/${listedPage.slug}`}
								>
									<strong>{listedPage.title}</strong>
									<span>{listedPage.description}</span>
								</Link>
							</li>
						))}
					</ul>
				</section>

				<div className="content-page-index-intro">
					<ArticleBody body={page.body} />
				</div>
				<EntityIndexTree copy={copy} entries={entities} />
				<QuipCollection locale={locale} nextLabel={copy.nextQuip} />
			</main>
		</SiteShell>
	);
}
