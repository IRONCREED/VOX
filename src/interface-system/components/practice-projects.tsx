import type { Locale, LocalizedAboutStory } from '../../content-catalog/domain/content-model';
import { sortPracticeProjects } from '../../content-catalog/domain/practice-portfolio';
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
	const entries = portfolio?.entries ?? [];
	const testimonials = story.sections.find((section) => section.kind === 'testimonials');
	const reviews = testimonials?.entries ?? [];
	const collator = new Intl.Collator(locale, { sensitivity: 'base', numeric: true });
	const projects = sortPracticeProjects(entries, map.workTypes, locale).map((entry) => ({
		id: entry.id,
		title: entry.title,
		clientId: entry.clientId,
		countryCodes: entry.countryCodes,
		workTypes: entry.workTypes,
		primaryWorkType: entry.primaryWorkType,
		originKind: entry.originKind,
		parentId: entry.parentId,
		reviewCount: entry.reviewIds?.length ?? 0,
		relations: (entry.relations ?? [])
			.filter((relation) => !['part-of', 'has-component', 'credited-under'].includes(relation.type))
			.map((relation) => ({
				...relation,
				title: entries.find((item) => item.id === relation.targetId)?.title ?? relation.targetId,
			})),
		content: (
			<>
				{entry.meta ? <p className="practice-project__meta">{entry.meta}</p> : null}
				<ArticleBody body={entry.body} />
				{entry.links?.length ? (
					<ul className="practice-project__links">
						{entry.links.map((link) => (
							<li key={link.href}>
								<a href={link.href} target="_blank" rel="noreferrer noopener">
									{link.label}
								</a>
							</li>
						))}
					</ul>
				) : null}
				{entry.components?.length ? (
					<section aria-label={map.labels.components}>
						<p className="practice-project__meta">{map.labels.components}</p>
						<ul className="practice-project__tree">
							{entry.components
								.toSorted((a, b) => collator.compare(a.title, b.title))
								.map((component) => (
									<li key={component.id}>
										<details className="practice-project">
											<summary>
												<span>{component.title}</span>
												<span aria-hidden="true">+</span>
											</summary>
											<div className="practice-project__content">
												{component.links.map((link) => (
													<a
														key={link.href}
														href={link.href}
														target="_blank"
														rel="noreferrer noopener"
													>
														{link.label}
													</a>
												))}
											</div>
										</details>
									</li>
								))}
						</ul>
					</section>
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
			</>
		),
	}));
	return (
		<PracticeMap
			countries={map.countries}
			workTypes={map.workTypes}
			labels={map.labels}
			projects={projects}
			reviewNote={
				<ArticleBody body={[testimonials?.body, portfolio?.body].filter(Boolean).join('\n\n')} />
			}
		/>
	);
}
