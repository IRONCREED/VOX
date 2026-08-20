import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
	getAvailableTags,
	getInterfaceCopy,
	getNavigation,
	isTagId,
	paginateArticles,
} from '../../src/content-catalog/adapters/corpus-content-repository';
import { isLocale } from '../../src/content-catalog/domain/content-model';
import { HomePageTemplate } from '../../src/interface-system/templates/home-page-template';
import { getBuildIdentity } from '../../src/site-navigation/application/build-identity';
import { getSiteOrigin } from '../../src/site-metadata/site-origin';

interface HomePageProps {
	params: Promise<{ locale: string }>;
	searchParams: Promise<{ page?: string | string[]; tag?: string | string[] }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
	const { locale } = await params;
	if (!isLocale(locale)) {
		return {};
	}

	const copy = getInterfaceCopy(locale);
	const origin = getSiteOrigin();
	const canonical = new URL(`/${locale}/`, origin);
	const socialPreview = new URL('/og.png', origin);
	const title = `IRON CREED — ${copy.homeTitle}`;

	return {
		title,
		description: copy.homeDescription,
		alternates: {
			canonical,
			languages: {
				uk: new URL('/uk/', origin),
				en: new URL('/en/', origin),
				'x-default': new URL('/uk/', origin),
			},
		},
		openGraph: {
			title,
			description: copy.homeDescription,
			images: [
				{
					alt: 'IRON CREED — architecture, memory, and formal systems',
					height: 630,
					url: socialPreview,
					width: 1200,
				},
			],
			siteName: 'IRON CREED',
			type: 'website',
			url: canonical,
		},
		twitter: {
			card: 'summary_large_image',
			description: copy.homeDescription,
			images: [socialPreview],
			title,
		},
	};
}

export default async function HomePage({ params, searchParams }: HomePageProps) {
	const [{ locale }, query] = await Promise.all([params, searchParams]);
	if (!isLocale(locale)) {
		notFound();
	}

	const requestedPage = Number(Array.isArray(query.page) ? query.page[0] : query.page);
	const requestedTag = Array.isArray(query.tag) ? query.tag[0] : query.tag;
	const activeTagId = requestedTag && isTagId(requestedTag) ? requestedTag : undefined;
	const materials = paginateArticles(locale, { tagId: activeTagId }, requestedPage);

	return (
		<HomePageTemplate
			activeTagId={activeTagId}
			availableTags={getAvailableTags(locale)}
			buildIdentity={getBuildIdentity()}
			copy={getInterfaceCopy(locale)}
			locale={locale}
			materials={materials}
			navigation={getNavigation(locale, undefined, true)}
		/>
	);
}
