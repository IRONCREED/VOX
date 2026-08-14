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
import { LoadingGate } from '../components/loading-gate';
import { SiteHeader } from '../components/site-header';
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
}

export function SiteShell({
	buildIdentity,
	children,
	companion,
	copy,
	locale,
	localeLinks,
	navigation,
}: SiteShellProps) {
	const corpusIndexPage = getContentPageById(locale, 'page.corpus-index');
	const policyLinks = getPolicyPages(locale).map((page) => ({
		href: getContentPageHref(page),
		label: page.shortLabel,
	}));

	return (
		<>
			<LoadingGate releaseId={buildIdentity.label} />
			<div className={`interface-shell${companion ? ' has-companion' : ' has-listing'}`}>
				<SiteHeader
					currentLocale={locale}
					darkThemeLabel={copy.darkTheme}
					languageLabel={copy.language}
					lightThemeLabel={copy.lightTheme}
					localeLinks={localeLinks}
					themeLabel={copy.theme}
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
					policyLinks={policyLinks}
				/>
				{children}
				{companion}
			</div>
		</>
	);
}
