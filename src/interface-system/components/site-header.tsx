import Link from 'next/link';
import type { Locale } from '../../content-catalog/domain/content-model';
import { BrandMark } from './brand-mark';
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
}

export function SiteHeader({
	currentLocale,
	darkThemeLabel,
	lightThemeLabel,
	localeLinks,
	languageLabel,
	themeLabel,
}: SiteHeaderProps) {
	return (
		<header className="system-header">
			<div className="header-crest">
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
				</div>
			</div>

			<Link aria-label="IRON CREED" className="header-wordmark" href={`/${currentLocale}/`}>
				<BrandMark variant="header" />
				<span>IRON CREED</span>
			</Link>

			<div aria-hidden="true" className="header-reserved" />
		</header>
	);
}
