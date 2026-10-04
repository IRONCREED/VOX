import type { Locale } from '../content-catalog/domain/content-model';

export function editorialFaq(
	locale: Locale,
	url: string,
	questions: { id: string; label: string; answer: string; url: string }[],
) {
	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		'@id': `${url}#questions`,
		url,
		inLanguage: locale,
		mainEntity: questions.map((question) => ({
			'@type': 'Question',
			'@id': `${question.url}#question`,
			name: question.label,
			url: question.url,
			acceptedAnswer: { '@type': 'Answer', text: question.answer },
		})),
	};
}
