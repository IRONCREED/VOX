import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
	getAllPublishedPageRoutes,
	getCompanionScenario,
	getContentPageByRoute,
	getContentPageHref,
	getInterfaceCopy,
	getNavigation,
	getPolicyPages,
	getProjectPages,
	getPublicEntityIndex,
	getTranslatedContentPage,
} from '../../../../src/content-catalog/adapters/corpus-content-repository';
import { isLocale } from '../../../../src/content-catalog/domain/content-model';
import { ContentPageTemplate } from '../../../../src/interface-system/templates/content-page-template';
import { CorpusIndexPageTemplate } from '../../../../src/interface-system/templates/corpus-index-page-template';
import { getBuildIdentity } from '../../../../src/site-navigation/application/build-identity';
import { getSiteOrigin } from '../../../../src/site-metadata/site-origin';

interface ContentPageProps {
	params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
	return getAllPublishedPageRoutes().map((page) => ({
		locale: page.locale,
		slug: page.slug,
	}));
}

export async function generateMetadata({ params }: ContentPageProps): Promise<Metadata> {
	const { locale, slug } = await params;
	if (!isLocale(locale)) return {};
	const page = getContentPageByRoute(locale, slug);
	if (!page) return {};

	const origin = getSiteOrigin();
	const canonical = new URL(getContentPageHref(page), origin);
	const ukPage = locale === 'uk' ? page : getTranslatedContentPage(page, 'uk');
	const enPage = locale === 'en' ? page : getTranslatedContentPage(page, 'en');
	const languages: Record<string, URL> = {};
	if (ukPage) {
		languages.uk = new URL(getContentPageHref(ukPage), origin);
		languages['x-default'] = new URL(getContentPageHref(ukPage), origin);
	}
	if (enPage) languages.en = new URL(getContentPageHref(enPage), origin);
	const title = `${page.title} — IRON CREED`;

	return {
		title,
		description: page.description,
		alternates: { canonical, languages },
		openGraph: {
			title,
			description: page.description,
			images: [],
			type: 'website',
			url: canonical,
		},
		twitter: {
			card: 'summary',
			description: page.description,
			images: [],
			title,
		},
	};
}

export default async function ContentPage({ params }: ContentPageProps) {
	const { locale, slug } = await params;
	if (!isLocale(locale)) notFound();
	const page = getContentPageByRoute(locale, slug);
	if (!page) notFound();

	const otherLocale = locale === 'uk' ? 'en' : 'uk';
	const translatedPage = getTranslatedContentPage(page, otherLocale);
	const common = {
		buildIdentity: getBuildIdentity(),
		copy: getInterfaceCopy(locale),
		locale,
		navigation: getNavigation(
			locale,
			undefined,
			false,
			['material-cycle', 'anthem'].includes(page.pageType) ? 'page.about' : page.pageId,
		),
		page,
		translatedPage,
	};

	if (page.pageType === 'corpus-index') {
		return <CorpusIndexPageTemplate {...common} entities={getPublicEntityIndex(locale)} />;
	}

	return (
		<ContentPageTemplate
			{...common}
			companionScenario={
				page.conversationViewId ? getCompanionScenario(page.conversationViewId, locale) : undefined
			}
			policyPages={getPolicyPages(locale)}
			projectPages={getProjectPages(locale)}
		/>
	);
}
