import type { ReactNode } from 'react';
import type {
	InterfaceCopy,
	Locale,
	NavigationItem,
} from '../../content-catalog/domain/content-model';
import {
	getContentPageById,
	getContentPageHref,
	getPolicyPages,
} from '../../content-catalog/adapters/corpus-content-repository';
import type { BuildIdentity } from '../../site-navigation/application/build-identity';
import { InlineMarkdown } from '../components/article-body';
import { LoadingGate } from '../components/loading-gate';
import type { HeaderContextActions } from '../components/header-action-dock';
import { SiteHeader } from '../components/site-header';
import { SiteModalLayer, type ContentNotice } from '../components/site-modal-layer';
import { SiteNavigation } from '../components/site-navigation';

interface LocaleLink {
	locale: Locale;
	href: string;
	direct: boolean;
}

interface SiteShellProps {
	buildIdentity: BuildIdentity;
	children: ReactNode;
	companion?: ReactNode;
	copy: InterfaceCopy;
	locale: Locale;
	localeLinks: LocaleLink[];
	navigation: NavigationItem[];
	headerActions?: HeaderContextActions;
	contentNotice?: ContentNotice;
}

export function SiteShell({
	buildIdentity,
	children,
	companion,
	copy,
	locale,
	localeLinks,
	navigation,
	headerActions,
	contentNotice,
}: SiteShellProps) {
	const corpusIndexPage = getContentPageById(locale, 'page.corpus-index');
	const aboutPage = getContentPageById(locale, 'page.about');
	const policyLinks = getPolicyPages(locale).map((page) => ({
		href: getContentPageHref(page),
		label: page.shortLabel,
	}));

	return (
		<>
			<LoadingGate releaseId={buildIdentity.label} />
			{aboutPage ? (
				<SiteModalLayer
					contentNotice={contentNotice}
					copy={copy}
					locale={locale}
					welcome={{
						description: <InlineMarkdown source={aboutPage.description} />,
						href: getContentPageHref(aboutPage),
					}}
				/>
			) : null}
			<div className={`interface-shell${companion ? ' has-companion' : ' has-listing'}`}>
				<SiteHeader
					anthemLoadingLabel={copy.anthemLoading}
					anthemPauseLabel={copy.anthemPause}
					anthemPlayLabel={copy.anthemPlay}
					anthemUnavailableLabel={copy.anthemUnavailable}
					currentLocale={locale}
					darkThemeLabel={copy.darkTheme}
					languageLabel={copy.language}
					lightThemeLabel={copy.lightTheme}
					localeLinks={localeLinks}
					themeLabel={copy.theme}
					contextActions={headerActions}
				/>
				<SiteNavigation
					buildLabel={buildIdentity.label}
					buildTitle={copy.build}
					corpusIndexLink={
						corpusIndexPage
							? { href: getContentPageHref(corpusIndexPage), label: corpusIndexPage.shortLabel }
							: undefined
					}
					items={navigation}
					locale={locale}
					policyLinks={policyLinks}
					socialLabel={copy.socialNetworks}
				/>
				{children}
				{companion}
			</div>
		</>
	);
}
