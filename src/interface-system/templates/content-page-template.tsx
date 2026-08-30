import Link from 'next/link';
import type {
	CompanionScenario,
	InterfaceCopy,
	Locale,
	LocalizedContentPage,
	NavigationItem,
} from '../../content-catalog/domain/content-model';
import type { BuildIdentity } from '../../site-navigation/application/build-identity';
import { ArticleBody } from '../components/article-body';
import { AboutStory } from '../components/about-story';
import { CompanionPanel } from '../components/companion-panel';
import { QuipCollection } from '../components/quip-collection';
import { SiteShell } from './site-shell';

interface ContentPageTemplateProps {
	buildIdentity: BuildIdentity;
	companionScenario?: CompanionScenario;
	copy: InterfaceCopy;
	locale: Locale;
	navigation: NavigationItem[];
	page: LocalizedContentPage;
	policyPages: LocalizedContentPage[];
	translatedPage?: LocalizedContentPage;
}

export function ContentPageTemplate({
	buildIdentity,
	companionScenario,
	copy,
	locale,
	navigation,
	page,
	policyPages,
	translatedPage,
}: ContentPageTemplateProps) {
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
			companion={
				companionScenario ? (
					<CompanionPanel copy={copy} locale={locale} scenario={companionScenario} />
				) : undefined
			}
			copy={copy}
			locale={locale}
			localeLinks={localeLinks}
			navigation={navigation}
		>
			<main className="knowledge-panel knowledge-panel--content-page" id="main">
				<header className="content-page-header">
					<small>{page.eyebrow}</small>
					<h1>{page.title}</h1>
					<div className="title-rule" />
					<p>{page.description}</p>
				</header>

				<article className="article-document content-page-document">
					{page.pageType === 'policy' ? (
						<nav aria-label={copy.policyDirectory} className="policy-directory">
							<strong>{copy.policyDirectory}</strong>
							<ul>
								{policyPages.map((policy) => (
									<li key={policy.pageId}>
										<Link
											aria-current={policy.pageId === page.pageId ? 'page' : undefined}
											href={`/${locale}/pages/${policy.slug}`}
										>
											{policy.title}
										</Link>
									</li>
								))}
							</ul>
						</nav>
					) : null}
					<ArticleBody body={page.body} />
				</article>

				{page.pageType === 'about' && page.aboutStory ? (
					<AboutStory story={page.aboutStory} />
				) : null}

				<QuipCollection locale={locale} nextLabel={copy.nextQuip} />
			</main>
		</SiteShell>
	);
}
