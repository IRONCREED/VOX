import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
	getAllQuestionIndexEntries,
	getContentPageById,
	getInterfaceCopy,
	getNavigation,
	getPublicEntityIndex,
	getQuestionHref,
	getQuestionIndexEntry,
	getTranslatedContentPage,
} from '../../../../src/content-catalog/adapters/corpus-content-repository';
import { isLocale } from '../../../../src/content-catalog/domain/content-model';
import { CorpusIndexPageTemplate } from '../../../../src/interface-system/templates/corpus-index-page-template';
import { getBuildIdentity } from '../../../../src/site-navigation/application/build-identity';
import { getSiteOrigin } from '../../../../src/site-metadata/site-origin';

interface QuestionIndexPageProps {
	params: Promise<{ locale: string; questionId: string }>;
}

export function generateStaticParams() {
	return getAllQuestionIndexEntries().map((entry) => ({
		locale: entry.locale,
		questionId: entry.id,
	}));
}

export async function generateMetadata({ params }: QuestionIndexPageProps): Promise<Metadata> {
	const { locale, questionId } = await params;
	if (!isLocale(locale)) return {};
	const question = getQuestionIndexEntry(locale, questionId);
	if (!question) return {};
	const otherLocale = locale === 'uk' ? 'en' : 'uk';
	const canonical = new URL(getQuestionHref(locale, question.id), getSiteOrigin());
	const title = `${question.label} — IRON CREED`;
	return {
		title,
		description: question.summary,
		alternates: {
			canonical,
			languages: {
				uk: new URL(getQuestionHref('uk', question.id), getSiteOrigin()),
				en: new URL(getQuestionHref('en', question.id), getSiteOrigin()),
				'x-default': new URL(getQuestionHref('uk', question.id), getSiteOrigin()),
			},
		},
		openGraph: {
			title,
			description: question.summary,
			images: [],
			type: 'article',
			url: canonical,
		},
		robots: { index: true, follow: true },
		twitter: {
			card: 'summary',
			title,
			description: question.summary,
			images: [],
		},
		other: {
			'content-language-alternate': otherLocale,
		},
	};
}

export default async function QuestionIndexPage({ params }: QuestionIndexPageProps) {
	const { locale, questionId } = await params;
	if (!isLocale(locale)) notFound();
	const question = getQuestionIndexEntry(locale, questionId);
	const page = getContentPageById(locale, 'page.corpus-index');
	if (!question || !page) notFound();
	const translatedPage = getTranslatedContentPage(page, locale === 'uk' ? 'en' : 'uk');
	const canonical = new URL(getQuestionHref(locale, question.id), getSiteOrigin()).href;
	const structuredData = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'QAPage',
		inLanguage: locale,
		mainEntity: {
			'@type': 'Question',
			name: question.label,
			url: canonical,
			acceptedAnswer: {
				'@type': 'Answer',
				text: question.summary,
			},
		},
	}).replaceAll('<', '\\u003c');

	return (
		<>
			<script dangerouslySetInnerHTML={{ __html: structuredData }} type="application/ld+json" />
			<CorpusIndexPageTemplate
				buildIdentity={getBuildIdentity()}
				copy={getInterfaceCopy(locale)}
				entities={getPublicEntityIndex(locale)}
				locale={locale}
				navigation={getNavigation(locale, undefined, false, page.pageId)}
				page={page}
				selectedEntityId={question.id}
				translatedPage={translatedPage}
			/>
		</>
	);
}
