import Link from 'next/link';
import type {
	CompanionScenario,
	ContextualHint as ContextualHintModel,
	InterfaceCopy,
	Locale,
	LocalizedContentPage,
	NavigationItem,
} from '../../content-catalog/domain/content-model';
import type { BuildIdentity } from '../../site-navigation/application/build-identity';
import { ArticleBody, InlineMarkdown } from '../components/article-body';
import { AboutStory } from '../components/about-story';
import { CompanionPanel } from '../components/companion-panel';
import { ContextualHint } from '../components/contextual-hint';
import { QuipCollection } from '../components/quip-collection';
import { SiteShell } from './site-shell';
import { SectionIcon } from '../components/section-icon';
import { AnthemToggle } from '../components/anthem-toggle';
import { MaterialCycle } from '../components/material-cycle';

interface ContentPageTemplateProps {
	buildIdentity: BuildIdentity;
	companionScenario?: CompanionScenario;
	copy: InterfaceCopy;
	locale: Locale;
	navigation: NavigationItem[];
	page: LocalizedContentPage;
	policyPages: LocalizedContentPage[];
	projectPages: LocalizedContentPage[];
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
	projectPages,
	translatedPage,
}: ContentPageTemplateProps) {
	const otherLocale: Locale = locale === 'uk' ? 'en' : 'uk';
	const isProjectPage = projectPages.some((entry) => entry.pageId === page.pageId);
	const localeLinks = [
		{ locale, href: `/${locale}/pages/${page.slug}`, direct: true },
		{
			locale: otherLocale,
			href: translatedPage ? `/${otherLocale}/pages/${translatedPage.slug}` : `/${otherLocale}/`,
			direct: Boolean(translatedPage),
		},
	].toSorted((left, right) => (left.locale === 'uk' ? -1 : right.locale === 'uk' ? 1 : 0));
	const identityHint: ContextualHintModel | undefined =
		page.pageType === 'about' && page.aboutStory
			? {
					id: 'about-iron-creed-identity',
					locale,
					label: page.aboutStory.identityHintLabel,
					source: { kind: 'text', text: page.body },
				}
			: undefined;
	const identityTrigger = 'IRON CREED';
	const identityRemainder =
		identityHint && page.description.startsWith(identityTrigger)
			? page.description.slice(identityTrigger.length)
			: undefined;

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
					<h1 className="section-heading">
						<SectionIcon sectionId={isProjectPage ? 'about' : page.pageType} variant="heading" />
						<span>{page.title}</span>
					</h1>
					<div className="title-rule" />
					{page.pageType !== 'anthem' ? (
						<p className={identityHint ? 'content-page-header__identity' : undefined}>
							{identityHint && identityRemainder !== undefined ? (
								<>
									<ContextualHint
										closeLabel={copy.closeHint}
										hint={identityHint}
										triggerLabel={identityTrigger}
										variant="inline"
									/>
									<InlineMarkdown source={identityRemainder} />
								</>
							) : (
								<InlineMarkdown source={page.description} />
							)}
						</p>
					) : null}
				</header>
				{isProjectPage ? (
					<nav aria-label={projectPages[0].title} className="policy-directory project-directory">
						<ul>
							{projectPages.map((entry) => (
								<li key={entry.pageId}>
									<Link
										href={`/${locale}/pages/${entry.slug}`}
										aria-current={entry.pageId === page.pageId ? 'page' : undefined}
									>
										{entry.shortLabel}
									</Link>
								</li>
							))}
						</ul>
					</nav>
				) : null}
				{page.pageType === 'anthem' ? (
					<div className="anthem-controls">
						<AnthemToggle
							loadingLabel={copy.anthemLoading}
							pauseLabel={copy.anthemPause}
							playLabel={copy.anthemPlay}
							unavailableLabel={copy.anthemUnavailable}
							showLabel
						/>
					</div>
				) : null}
				{page.materialCycle ? <MaterialCycle cycle={page.materialCycle} /> : null}

				{page.pageType !== 'about' && page.pageType !== 'material-cycle' ? (
					<article
						className={`article-document content-page-document${page.pageType === 'anthem' ? ' anthem-lyrics' : ''}`}
						id="article-body"
						lang={page.pageType === 'anthem' ? 'en' : locale}
					>
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
				) : null}

				{page.pageType === 'about' && page.aboutStory ? (
					<AboutStory
						nextSlideLabel={copy.nextSlide}
						previousSlideLabel={copy.previousSlide}
						story={page.aboutStory}
					/>
				) : null}

				<QuipCollection locale={locale} nextLabel={copy.nextQuip} />
			</main>
		</SiteShell>
	);
}
