import type { Locale, LocalizedAboutStory } from '../../content-catalog/domain/content-model';
import { ArticleBody } from './article-body';
import { PracticeMap } from './practice-map';

export function PracticeProjects({
	story,
	locale,
}: {
	story: LocalizedAboutStory;
	locale: Locale;
}) {
	const map = story.practiceMap;
	if (!map) return null;
	const portfolio = story.sections.find((section) => section.kind === 'portfolio');
	const projects = portfolio?.entries ?? [];
	const collator = new Intl.Collator(locale, { sensitivity: 'base', numeric: true });
	const testimonials = story.sections.find((section) => section.kind === 'testimonials');
	const reviews = testimonials?.entries ?? [];
	const groups = map.countries.map((country) => {
		const entries = projects
			.filter((entry) => entry.countryCode === country.code)
			.toSorted((left, right) => collator.compare(left.title, right.title));
		return {
			code: country.code,
			clientCount: new Set(entries.map((entry) => entry.clientId)).size,
			projectCount: entries.length,
			content: entries.map((entry, index) => (
				<details className="practice-project" key={entry.id} open={index === 0}>
					<summary>
						<span>
							{entry.title}
							{entry.reviewIds?.length ? (
								<small className="practice-project__review-count">
									{map.labels.reviews}: {entry.reviewIds.length}
								</small>
							) : null}
						</span>
						<span aria-hidden="true">+</span>
					</summary>
					<div className="practice-project__content">
						{entry.meta ? <p className="practice-project__meta">{entry.meta}</p> : null}
						{!entry.id.startsWith('project-') ? <ArticleBody body={entry.body} /> : null}
						{entry.link ? (
							<a href={entry.link.href} target="_blank" rel="noreferrer noopener">
								{entry.link.label}
							</a>
						) : null}
						{entry.reviewIds?.map((id) => {
							const review = reviews.find((item) => item.id === id);
							return review ? (
								<figure className="practice-project__review" key={id}>
									<figcaption>
										{map.labels.review} · {review.meta}
									</figcaption>
									<ArticleBody body={review.body} />
								</figure>
							) : null;
						})}
					</div>
				</details>
			)),
		};
	});
	return (
		<PracticeMap
			countries={map.countries}
			labels={map.labels}
			groups={groups}
			reviewNote={
				<ArticleBody body={[testimonials?.body, portfolio?.body].filter(Boolean).join('\n\n')} />
			}
		/>
	);
}
