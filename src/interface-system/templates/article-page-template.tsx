import Link from 'next/link';
import type {
	ArticleSeriesContext,
	CompanionScenario,
	ContextualHint as ContextualHintModel,
	InterfaceCopy,
	Locale,
	LocalizedArticle,
	LocalizedTag,
	NavigationItem,
} from '../../content-catalog/domain/content-model';
import type { BuildIdentity } from '../../site-navigation/application/build-identity';
import { getDoiUrl } from '../../content-catalog/adapters/zenodo-record';
import { ArticleActions } from '../components/article-actions';
import { ArticleBody } from '../components/article-body';
import { CompanionPanel } from '../components/companion-panel';
import { ContextualHint } from '../components/contextual-hint';
import { ProtocolFolder } from '../components/protocol-folder';
import { ZenodoPublicationPanel } from '../components/zenodo-publication-panel';
import { SiteShell } from './site-shell';

interface CategoryModel {
	id: string;
	label: string;
}

interface ArticlePageTemplateProps {
	article: LocalizedArticle;
	buildIdentity: BuildIdentity;
	category: CategoryModel;
	companionScenario: CompanionScenario;
	copy: InterfaceCopy;
	hints: ContextualHintModel[];
	locale: Locale;
	navigation: NavigationItem[];
	resolvedTags: LocalizedTag[];
	translatedArticle?: LocalizedArticle;
	seriesContext?: ArticleSeriesContext;
}

export function ArticlePageTemplate({
	article,
	buildIdentity,
	category,
	companionScenario,
	copy,
	hints,
	locale,
	navigation,
	resolvedTags,
	seriesContext,
	translatedArticle,
}: ArticlePageTemplateProps) {
	const otherLocale: Locale = locale === 'uk' ? 'en' : 'uk';
	const authors: Array<{ displayName: string; url?: string }> =
		article.authorMetadata ?? article.authors.map((displayName) => ({ displayName }));
	const localeLinks = [
		{
			locale,
			href: `/${locale}/${article.category}/${article.slug}`,
			direct: true,
		},
		{
			locale: otherLocale,
			href: translatedArticle
				? `/${otherLocale}/${translatedArticle.category}/${translatedArticle.slug}`
				: `/${otherLocale}/`,
			direct: Boolean(translatedArticle),
		},
	].toSorted((left, right) => (left.locale === 'uk' ? -1 : right.locale === 'uk' ? 1 : 0));

	return (
		<SiteShell
			buildIdentity={buildIdentity}
			companion={<CompanionPanel copy={copy} locale={locale} scenario={companionScenario} />}
			copy={copy}
			locale={locale}
			localeLinks={localeLinks}
			navigation={navigation}
			headerActions={{
				markerId: 'article-actions',
				discuss: { href: '#companion', label: copy.discuss },
				deep: article.publication
					? {
							href: getDoiUrl(article.publication.doi),
							label: copy.deepArticle,
							external: true,
						}
					: undefined,
			}}
			contentNotice={
				article.ageRestriction.notice
					? {
							leaveHref: `/${locale}/${category.id}`,
							materialId: article.materialId,
							notice: article.ageRestriction.notice,
							rating: article.ageRestriction.rating,
						}
					: undefined
			}
		>
			<main className="knowledge-panel knowledge-panel--article" id="main">
				<nav aria-label="Breadcrumb" className="article-route">
					<Link
						aria-label={copy.back}
						href={
							seriesContext
								? `/${locale}/series/${seriesContext.series.slug}`
								: `/${locale}/${category.id}`
						}
					>
						‹
					</Link>
					<Link href={`/${locale}/${category.id}`}>{category.label}</Link>
					<i>/</i>
					{seriesContext ? (
						<>
							<Link href={`/${locale}/series/${seriesContext.series.slug}`}>
								{seriesContext.series.title}
							</Link>
							<i>/</i>
						</>
					) : null}
					<span>{article.title}</span>
				</nav>

				<div className="article-layout">
					<header className="article-copy">
						<small>{article.folderLabel}</small>
						{seriesContext ? (
							<Link
								className="article-series-membership"
								href={`/${locale}/series/${seriesContext.series.slug}`}
							>
								<span>{copy.materialSeries}</span>
								<strong>{seriesContext.series.title}</strong>
								<i>
									{seriesContext.position}/{seriesContext.total}
								</i>
							</Link>
						) : null}
						<h1>{article.title}</h1>
						<div className="title-rule" />
						<p>{article.description}</p>
						<div className="article-publication-meta">
							<span>{article.type}</span>
							<span>
								{authors.map((author, index) => (
									<span className="article-author" key={`${author.displayName}-${index}`}>
										{index > 0 ? ' · ' : null}
										{author.url ? (
											<a href={author.url} rel="me noreferrer noopener" target="_blank">
												{author.displayName}
											</a>
										) : (
											author.displayName
										)}
									</span>
								))}
							</span>
							<span>{article.edition}</span>
							<span>
								{copy.ageRating}: {article.ageRestriction.rating}
							</span>
						</div>
						<ul aria-label={copy.tags} className="article-tags">
							{resolvedTags.map((tag) => (
								<li key={tag.id}>
									<Link href={`/${locale}/${article.category}?tag=${tag.id}`}>{tag.label}</Link>
								</li>
							))}
						</ul>
					</header>

					<ProtocolFolder label={article.folderLabel} />
				</div>

				<ArticleActions
					articleBodyLabel={copy.articleBody}
					deepArticleLabel={copy.deepArticle}
					discussLabel={copy.discuss}
					publication={article.publication}
				/>

				{article.publication?.pdfFile ? (
					<ZenodoPublicationPanel copy={copy} publication={article.publication} />
				) : null}

				<section
					aria-labelledby="article-body-title"
					className={
						article.presentationMode === 'scenario-log'
							? 'article-document article-document--scenario-log'
							: 'article-document'
					}
					id="article-body"
				>
					<header>
						<small>IRON CREED / {article.translationKey.toUpperCase()}</small>
						<h2 id="article-body-title">{copy.articleBody}</h2>
					</header>
					<ArticleBody
						assets={article.assets}
						body={article.body}
						variant={article.presentationMode}
					/>

					{hints.length > 0 ? (
						<div className="article-hints">
							{hints.map((hint) => (
								<ContextualHint
									closeLabel={copy.closeHint}
									hint={hint}
									key={hint.id}
									prefix={copy.hint}
								/>
							))}
						</div>
					) : null}
				</section>

				{seriesContext ? (
					<nav aria-label={copy.materialSeries} className="article-series-navigation">
						<div>
							{seriesContext.previous ? (
								<Link href={seriesContext.previous.href} rel="prev">
									<small>← {copy.previousPart}</small>
									<strong>{seriesContext.previous.title}</strong>
								</Link>
							) : (
								<span />
							)}
							{seriesContext.next ? (
								<Link href={seriesContext.next.href} rel="next">
									<small>{copy.nextPart} →</small>
									<strong>{seriesContext.next.title}</strong>
								</Link>
							) : (
								<span />
							)}
						</div>
						<Link
							className="article-series-navigation__index"
							href={`/${locale}/series/${seriesContext.series.slug}`}
						>
							{copy.allParts} · {seriesContext.total}
						</Link>
					</nav>
				) : null}

				<footer className="knowledge-footer">
					<p>{article.memoryLine}</p>
				</footer>
			</main>
		</SiteShell>
	);
}
