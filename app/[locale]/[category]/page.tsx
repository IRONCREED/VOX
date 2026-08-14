import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
	getAvailableTags,
	getCategories,
	getCategory,
	getInterfaceCopy,
	getNavigation,
	isTagId,
	paginateArticles,
} from '../../../src/content-catalog/adapters/corpus-content-repository';
import { isLocale, SUPPORTED_LOCALES } from '../../../src/content-catalog/domain/content-model';
import { CategoryPageTemplate } from '../../../src/interface-system/templates/category-page-template';
import { getBuildIdentity } from '../../../src/site-navigation/application/build-identity';
import { getSiteOrigin } from '../../../src/site-metadata/site-origin';

interface CategoryPageProps {
	params: Promise<{ locale: string; category: string }>;
	searchParams: Promise<{ page?: string | string[]; tag?: string | string[] }>;
}

export function generateStaticParams() {
	return SUPPORTED_LOCALES.flatMap((locale) =>
		getCategories(locale).map((category) => ({
			locale,
			category: category.id,
		})),
	);
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
	const { locale, category: categoryId } = await params;
	if (!isLocale(locale)) {
		return {};
	}

	const category = getCategory(locale, categoryId);
	if (!category) {
		return {};
	}

	const origin = getSiteOrigin();
	const canonical = new URL(`/${locale}/${category.id}`, origin);

	return {
		title: `${category.label} — IRON CREED`,
		description: category.description,
		alternates: {
			canonical,
			languages: {
				uk: new URL(`/uk/${category.id}`, origin),
				en: new URL(`/en/${category.id}`, origin),
				'x-default': new URL(`/uk/${category.id}`, origin),
			},
		},
		openGraph: {
			title: `${category.label} — IRON CREED`,
			description: category.description,
			type: 'website',
			url: canonical,
		},
	};
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
	const [{ locale, category: categoryId }, query] = await Promise.all([params, searchParams]);
	if (!isLocale(locale)) {
		notFound();
	}

	const category = getCategory(locale, categoryId);
	if (!category) {
		notFound();
	}

	const requestedPage = Number(Array.isArray(query.page) ? query.page[0] : query.page);
	const requestedTag = Array.isArray(query.tag) ? query.tag[0] : query.tag;
	const activeTagId = requestedTag && isTagId(requestedTag) ? requestedTag : undefined;
	const materials = paginateArticles(
		locale,
		{ categoryId: category.id, tagId: activeTagId },
		requestedPage,
	);

	return (
		<CategoryPageTemplate
			activeTagId={activeTagId}
			availableTags={getAvailableTags(locale, category.id)}
			buildIdentity={getBuildIdentity()}
			category={category}
			copy={getInterfaceCopy(locale)}
			locale={locale}
			materials={materials}
			navigation={getNavigation(locale, category.id)}
		/>
	);
}
