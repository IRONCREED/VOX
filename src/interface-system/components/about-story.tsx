import Link from 'next/link';
import type {
	AboutStoryLink,
	LocalizedAboutStory,
} from '../../content-catalog/domain/content-model';
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

export function AboutStory({ story }: { story: LocalizedAboutStory }) {
	return (
		<section className="about-story">
			<header className="about-story__transition">
				<small>{story.transition.eyebrow}</small>
				<h2>{story.transition.title}</h2>
				<ArticleBody body={story.transition.body} />
			</header>

			<section className="about-cycle" aria-labelledby="about-cycle-title">
				<header>
					<small>{story.lifecycle.eyebrow}</small>
					<h2 id="about-cycle-title">{story.lifecycle.title}</h2>
					<p>{story.lifecycle.summary}</p>
				</header>
				<ol className="about-cycle__steps">
					{story.lifecycle.steps.map((step) => (
						<li key={step.id}>
							<small>{String(step.order).padStart(2, '0')}</small>
							<strong>{step.title}</strong>
							<p>{step.description}</p>
						</li>
					))}
				</ol>
				<div className="about-cycle__examples">
					{story.lifecycle.examples.map((example) => (
						<div className="about-cycle__example" key={example.id}>
							<StoryLink link={example.source} />
							<span aria-hidden="true">→</span>
							<StoryLink link={example.result} />
						</div>
					))}
				</div>
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
						<ArticleBody body={section.body} />

						{section.flow ? (
							<ol className="about-service__flow">
								{section.flow.map((item) => (
									<li key={item}>{item}</li>
								))}
							</ol>
						) : null}

						{section.entries.length > 0 ? (
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

						{section.link ? (
							<StoryLink className="about-service__link" link={section.link} />
						) : null}
					</section>
				))}
			</div>
		</section>
	);
}
