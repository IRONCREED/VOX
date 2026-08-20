import { getDoiUrl } from '../../content-catalog/adapters/zenodo-record';
import type { ZenodoPublication } from '../../content-catalog/domain/content-model';

interface ArticleActionsProps {
	articleBodyLabel: string;
	deepArticleLabel: string;
	discussLabel: string;
	publication?: ZenodoPublication;
}

export function ArticleActions({
	articleBodyLabel,
	deepArticleLabel,
	discussLabel,
	publication,
}: ArticleActionsProps) {
	return (
		<nav
			aria-label={articleBodyLabel}
			className={`article-actions${publication ? '' : ' article-actions--dialogue-only'}`}
			id="article-actions"
		>
			<a className="article-action article-action--discuss" href="#companion">
				<span aria-hidden="true" className="article-action__icon">
					⌁
				</span>
				<span>
					<small>{discussLabel}</small>
					<strong>IRON CREED / DIALOGUE</strong>
				</span>
				<i aria-hidden="true">↓</i>
			</a>
			{publication ? (
				<a
					className="article-action"
					href={getDoiUrl(publication.doi)}
					rel="noreferrer"
					target="_blank"
				>
					<span aria-hidden="true" className="article-action__icon">
						▭
					</span>
					<span>
						<small>{deepArticleLabel}</small>
						<strong>{publication.title}</strong>
						<em>ZENODO · {publication.doi}</em>
					</span>
					<i aria-hidden="true">↗</i>
				</a>
			) : null}
		</nav>
	);
}
