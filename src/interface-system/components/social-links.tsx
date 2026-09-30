import type { Locale } from '../../content-catalog/domain/content-model';

const SOCIAL_LINKS = [
	{ href: 'https://www.facebook.com/ironcreed.fb', label: 'Facebook', mark: 'f' },
	{ href: 'https://www.linkedin.com/showcase/ironcreed/', label: 'LinkedIn', mark: 'in' },
	{ href: 'https://t.me/+6-ge0JXP25o4MTQy', label: 'Telegram', mark: 'TG' },
	{ href: 'https://github.com/IRONCREED', label: 'GitHub', mark: 'GH' },
] as const;

interface SocialLinksProps {
	label: string;
	locale: Locale;
	variant?: 'modal' | 'sidebar';
}

export function SocialLinks({ label, locale, variant = 'sidebar' }: SocialLinksProps) {
	const links = SOCIAL_LINKS;
	return (
		<section aria-label={label} className={`social-links social-links--${variant}`} lang={locale}>
			<strong>{label}</strong>
			<ul>
				{links.map((link) => (
					<li key={link.href}>
						<a href={link.href} rel="noreferrer noopener" target="_blank">
							<i aria-hidden="true">{link.mark}</i>
							<span>{link.label}</span>
						</a>
					</li>
				))}
			</ul>
		</section>
	);
}
