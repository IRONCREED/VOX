import type { CompanionScenario, Locale } from '../../content-catalog/domain/content-model';
import { getQuestionHref } from '../../content-catalog/adapters/corpus-content-repository';
import { editorialFaq } from '../../site-metadata/editorial-faq';
import { getSiteOrigin } from '../../site-metadata/site-origin';
import { ArticleBody } from './article-body';

export function EditorialQuestions({
	scenario,
	locale,
	url,
}: {
	scenario: CompanionScenario;
	locale: Locale;
	url: string;
}) {
	const questions = scenario.questions.map((question) => ({
		...question,
		url: new URL(getQuestionHref(locale, question.id), getSiteOrigin()).href,
	}));
	if (!questions.length) return null;
	return (
		<section className="editorial-questions" id="editorial-questions">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(editorialFaq(locale, url, questions)).replaceAll('<', '\\u003c'),
				}}
			/>
			<details>
				<summary>
					{locale === 'uk' ? 'Питання до матеріалу' : 'Questions about this material'} ·{' '}
					{questions.length}
				</summary>
				{questions.map((question) => (
					<details key={question.id}>
						<summary>{question.label}</summary>
						<ArticleBody body={question.answer} />
						<a href={getQuestionHref(locale, question.id)}>
							{locale === 'uk' ? 'Відкрити в реєстрі' : 'Open in the registry'}
						</a>
					</details>
				))}
			</details>
		</section>
	);
}
