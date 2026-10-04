import Link from 'next/link';
import type {
	AboutStoryLink,
	Locale,
	LocalizedAboutStory,
} from '../../content-catalog/domain/content-model';
import { AboutCardSlider } from './about-card-slider';
import { ArticleBody } from './article-body';
import { PracticeProjects } from './practice-projects';

function StoryLink({ link, className }: { link: AboutStoryLink; className?: string }) {
	if (link.href.startsWith('/')) {
		return (
			<Link className={className} href={link.href}>
				{link.label}
			</Link>
		);
	}

	return (
		<a className={className} href={link.href} rel="noreferrer noopener" target="_blank">
			{link.label}
		</a>
	);
}

interface AboutStoryProps {
	locale: Locale;
	nextSlideLabel: string;
	previousSlideLabel: string;
	story: LocalizedAboutStory;
}

export function AboutStory({ locale, nextSlideLabel, previousSlideLabel, story }: AboutStoryProps) {
	return (
		<section className="about-story">
			<div className="about-services">
				{story.sections
					.filter((section) => !story.practiceMap || section.kind !== 'testimonials')
					.map((section, index) => (
						<section
							id={section.kind === 'profiles' ? 'team-profiles' : undefined}
							tabIndex={section.kind === 'profiles' ? -1 : undefined}
							className={`about-service about-service--${section.kind}`}
							data-status={section.status}
							key={section.id}
						>
							<header>
								<small>{String(index + 1).padStart(2, '0')}</small>
								<h2>{section.title}</h2>
								<p>{section.summary}</p>
							</header>
							{section.kind === 'portfolio' && story.practiceMap ? (
								<PracticeProjects story={story} locale={locale} />
							) : null}
							{section.kind !== 'testimonials' &&
							!(section.kind === 'portfolio' && story.practiceMap) ? (
								<ArticleBody body={section.body} />
							) : null}

							{section.flow ? (
								<ol className="about-service__flow">
									{section.flow.map((item) => (
										<li key={item}>{item}</li>
									))}
								</ol>
							) : null}

							{section.entries.length > 0 &&
							!(section.kind === 'portfolio' && story.practiceMap) ? (
								section.kind === 'portfolio' || section.kind === 'testimonials' ? (
									<AboutCardSlider
										label={section.title}
										nextLabel={nextSlideLabel}
										previousLabel={previousSlideLabel}
									>
										{section.entries.map((entry) => (
											<article key={entry.id}>
												{entry.meta ? <small>{entry.meta}</small> : null}
												<h3>{entry.title}</h3>
												<ArticleBody body={entry.body} />
												{entry.link ? <StoryLink link={entry.link} /> : null}
											</article>
										))}
									</AboutCardSlider>
								) : (
									<div className="about-service__entries">
										{section.entries.map((entry) => (
											<article key={entry.id}>
												{entry.meta ? <small>{entry.meta}</small> : null}
												<h3>{entry.title}</h3>
												<ArticleBody body={entry.body} />
												{entry.link ? <StoryLink link={entry.link} /> : null}
											</article>
										))}
									</div>
								)
							) : null}

							{section.placeholder ? (
								<p className="about-service__placeholder" role="status">
									{section.placeholder}
								</p>
							) : null}

							{section.fields ? (
								<ul className="about-service__fields">
									{section.fields.map((field) => (
										<li key={field}>{field}</li>
									))}
								</ul>
							) : null}

							{section.kind === 'testimonials' ? (
								<div className="about-service__review-note">
									<ArticleBody body={section.body} />
								</div>
							) : null}

							{section.link ? (
								<StoryLink className="about-service__link" link={section.link} />
							) : null}
						</section>
					))}
			</div>
		</section>
	);
}
