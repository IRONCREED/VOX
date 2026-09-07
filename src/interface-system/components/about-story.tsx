import Link from 'next/link';
import type {
	AboutStoryLink,
	LocalizedAboutStory,
} from '../../content-catalog/domain/content-model';
import { AboutCardSlider } from './about-card-slider';
import { ArticleBody } from './article-body';

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
	nextSlideLabel: string;
	previousSlideLabel: string;
	story: LocalizedAboutStory;
}

export function AboutStory({ nextSlideLabel, previousSlideLabel, story }: AboutStoryProps) {
	return (
		<section className="about-story">
			<section className="about-cycle about-cycle--combined" aria-labelledby="about-cycle-title">
				<header className="about-story__transition">
					<small>{story.transition.eyebrow}</small>
					<h2 id="about-cycle-title">{story.transition.title}</h2>
					<ArticleBody body={story.transition.body} />
				</header>
			</section>

			<div className="about-services">
				{story.sections.map((section) => (
					<section
						className={`about-service about-service--${section.kind}`}
						data-status={section.status}
						key={section.id}
					>
						<header>
							<small>{String(section.order).padStart(2, '0')}</small>
							<h2>{section.title}</h2>
							<p>{section.summary}</p>
						</header>
						{section.kind !== 'testimonials' ? <ArticleBody body={section.body} /> : null}

						{section.flow ? (
							<ol className="about-service__flow">
								{section.flow.map((item) => (
									<li key={item}>{item}</li>
								))}
							</ol>
						) : null}

						{section.entries.length > 0 ? (
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
