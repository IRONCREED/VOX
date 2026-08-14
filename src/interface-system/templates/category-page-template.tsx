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

interface CategoryModel {
	id: string;
	label: string;
	description: string;
}

interface CategoryPageTemplateProps {
	activeTagId?: string;
	availableTags: LocalizedTag[];
	buildIdentity: BuildIdentity;
	category: CategoryModel;
	copy: InterfaceCopy;
	locale: Locale;
	materials: PaginatedArticles;
	navigation: NavigationItem[];
}

export function CategoryPageTemplate({
	activeTagId,
	availableTags,
	buildIdentity,
	category,
	copy,
	locale,
	materials,
	navigation,
}: CategoryPageTemplateProps) {
	const tagQuery = activeTagId ? `?tag=${encodeURIComponent(activeTagId)}` : '';

	return (
		<SiteShell
			buildIdentity={buildIdentity}
			copy={copy}
			locale={locale}
			localeLinks={[
				{ locale: 'uk', href: `/uk/${category.id}${tagQuery}`, direct: true },
				{ locale: 'en', href: `/en/${category.id}${tagQuery}`, direct: true },
			]}
			navigation={navigation}
		>
			<main className="knowledge-panel knowledge-panel--listing" id="main">
				<header className="listing-introduction">
					<small>IRON CREED / {category.id.toUpperCase()}</small>
					<h1>{category.label}</h1>
					<div className="title-rule" />
					<p>{category.description}</p>
				</header>

				<div className="listing-section-heading">
					<span>{copy.latestMaterials}</span>
					<i />
					<small>{String(materials.totalItems).padStart(2, '0')}</small>
				</div>

				<MaterialFeed
					activeTagId={activeTagId}
					availableTags={availableTags}
					categoryId={category.id}
					copy={copy}
					initialPage={materials}
					key={`${locale}:${category.id}:${activeTagId ?? 'all'}:${materials.page}`}
					locale={locale}
				/>

				<QuipCollection locale={locale} nextLabel={copy.nextQuip} />
			</main>
		</SiteShell>
	);
}
