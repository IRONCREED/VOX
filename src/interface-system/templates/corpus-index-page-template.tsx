import type {
	InterfaceCopy,
	Locale,
	NavigationItem,
	PublicEntityIndexEntry,
} from '../../content-catalog/domain/content-model';
import type { LocalizedContentPage } from '../../content-catalog/domain/content-model';
import { getQuestionHref } from '../../content-catalog/adapters/corpus-content-repository';
import type { BuildIdentity } from '../../site-navigation/application/build-identity';
import { ArticleBody } from '../components/article-body';
import { EntityIndexTree } from '../components/entity-index-tree';
import { QuipCollection } from '../components/quip-collection';
import { SiteShell } from './site-shell';
import { editorialFaq } from '../../site-metadata/editorial-faq';
import { getSiteOrigin } from '../../site-metadata/site-origin';

interface CorpusIndexPageTemplateProps {
	buildIdentity: BuildIdentity;
	copy: InterfaceCopy;
	entities: PublicEntityIndexEntry[];
	locale: Locale;
	navigation: NavigationItem[];
	page: LocalizedContentPage;
	translatedPage?: LocalizedContentPage;
	selectedEntityId?: string;
}

export function CorpusIndexPageTemplate({
	buildIdentity,
	copy,
	entities,
	locale,
	navigation,
	page,
	selectedEntityId,
	translatedPage,
}: CorpusIndexPageTemplateProps) {
	const otherLocale: Locale = locale === 'uk' ? 'en' : 'uk';
	const questions = entities
		.filter(
			(entry) =>
				entry.kind === 'question' &&
				entry.answer &&
				(!selectedEntityId || entry.id === selectedEntityId),
		)
		.map((entry) => ({
			id: entry.id,
			label: entry.label,
			answer: entry.answer!,
			url: new URL(getQuestionHref(locale, entry.id), getSiteOrigin()).href,
		}));
	const faqUrl = new URL(
		selectedEntityId ? getQuestionHref(locale, selectedEntityId) : `/${locale}/pages/${page.slug}`,
		getSiteOrigin(),
	).href;
	const localeLinks = [
		{
			locale,
			href: selectedEntityId
				? getQuestionHref(locale, selectedEntityId)
				: `/${locale}/pages/${page.slug}`,
			direct: true,
		},
		{
			locale: otherLocale,
			href: selectedEntityId
				? getQuestionHref(otherLocale, selectedEntityId)
				: translatedPage
					? `/${otherLocale}/pages/${translatedPage.slug}`
					: `/${otherLocale}/`,
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
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(editorialFaq(locale, faqUrl, questions)).replaceAll(
							'<',
							'\\u003c',
						),
					}}
				/>
				<header className="content-page-header">
					<small>{page.eyebrow}</small>
					<h1>{page.title}</h1>
					<p>{page.description}</p>
				</header>

				<div className="content-page-index-intro">
					<ArticleBody body={page.body} />
				</div>
				<EntityIndexTree copy={copy} entries={entities} initialEntityId={selectedEntityId} />
				<QuipCollection locale={locale} nextLabel={copy.nextQuip} />
			</main>
		</SiteShell>
	);
}
