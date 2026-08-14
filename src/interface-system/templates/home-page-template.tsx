import type {
	InterfaceCopy,
	Locale,
	LocalizedTag,
	NavigationItem,
	PaginatedArticles,
} from '../../content-catalog/domain/content-model';
import type { BuildIdentity } from '../../site-navigation/application/build-identity';
import { MaterialFeed } from '../components/material-feed';
import { QuipCollection } from '../components/quip-collection';
import { SiteShell } from './site-shell';

interface HomePageTemplateProps {
	activeTagId?: string;
	availableTags: LocalizedTag[];
	buildIdentity: BuildIdentity;
	copy: InterfaceCopy;
	locale: Locale;
	materials: PaginatedArticles;
	navigation: NavigationItem[];
}

export function HomePageTemplate({
	activeTagId,
	availableTags,
	buildIdentity,
	copy,
	locale,
	materials,
	navigation,
}: HomePageTemplateProps) {
	const tagQuery = activeTagId ? `?tag=${encodeURIComponent(activeTagId)}` : '';

	return (
		<SiteShell
			buildIdentity={buildIdentity}
			copy={copy}
			locale={locale}
			localeLinks={[
				{ locale: 'uk', href: `/uk/${tagQuery}`, direct: true },
				{ locale: 'en', href: `/en/${tagQuery}`, direct: true },
			]}
			navigation={navigation}
		>
			<main className="knowledge-panel knowledge-panel--listing" id="main">
				<header className="listing-introduction">
					<small>IRON CREED / KNOWLEDGE SYSTEM</small>
					<h1>{copy.homeTitle}</h1>
					<div className="title-rule" />
					<p>{copy.homeDescription}</p>
				</header>

				<div className="listing-section-heading">
					<span>{copy.latestMaterials}</span>
					<i />
					<small>{String(materials.totalItems).padStart(2, '0')}</small>
				</div>

				<MaterialFeed
					activeTagId={activeTagId}
					availableTags={availableTags}
					copy={copy}
					initialPage={materials}
					key={`${locale}:all:${activeTagId ?? 'all'}:${materials.page}`}
					locale={locale}
				/>

				<QuipCollection locale={locale} nextLabel={copy.nextQuip} />
			</main>
		</SiteShell>
	);
}
