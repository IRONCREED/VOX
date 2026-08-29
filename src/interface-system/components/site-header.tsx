import Link from 'next/link';
import type { Locale } from '../../content-catalog/domain/content-model';
import { AnthemToggle } from './anthem-toggle';
import { BrandMark } from './brand-mark';
import { HeaderActionDock, type HeaderContextActions } from './header-action-dock';
import { SidebarToggle } from './sidebar-toggle';
import { ThemeSwitcher } from './theme-switcher';

interface LocaleLink {
	locale: Locale;
	href: string;
	direct: boolean;
}

interface SiteHeaderProps {
	currentLocale: Locale;
	darkThemeLabel: string;
	lightThemeLabel: string;
	localeLinks: LocaleLink[];
	languageLabel: string;
	themeLabel: string;
	anthemPlayLabel: string;
	anthemPauseLabel: string;
	anthemLoadingLabel: string;
	anthemUnavailableLabel: string;
	contextActions?: HeaderContextActions;
}

export function SiteHeader({
	currentLocale,
	darkThemeLabel,
	lightThemeLabel,
	localeLinks,
	languageLabel,
	themeLabel,
	anthemPlayLabel,
	anthemPauseLabel,
	anthemLoadingLabel,
	anthemUnavailableLabel,
	contextActions,
}: SiteHeaderProps) {
	return (
		<header className="system-header">
			<div className="header-crest">
				<Link aria-label="IRON CREED" className="header-wordmark" href={`/${currentLocale}/`}>
					<BrandMark variant="header" />
					<span>IRON CREED</span>
				</Link>
				<SidebarToggle locale={currentLocale} />
			</div>

			<div className="header-control-cell">
				<div className="header-controls">
					<nav aria-label={languageLabel} className="locale-switcher">
						{localeLinks.map((link) => (
							<Link
								aria-current={link.locale === currentLocale ? 'page' : undefined}
								className={!link.direct ? 'is-fallback' : undefined}
								href={link.href}
								key={link.locale}
								lang={link.locale}
							>
								{link.locale === 'uk' ? 'УКР' : 'EN'}
							</Link>
						))}
					</nav>
					<ThemeSwitcher
						darkLabel={darkThemeLabel}
						label={themeLabel}
						lightLabel={lightThemeLabel}
					/>
					<AnthemToggle
						loadingLabel={anthemLoadingLabel}
						pauseLabel={anthemPauseLabel}
						playLabel={anthemPlayLabel}
						unavailableLabel={anthemUnavailableLabel}
					/>
					<HeaderActionDock actions={contextActions} />
				</div>
			</div>

			<div aria-hidden="true" className="header-reserved" />
		</header>
	);
}
