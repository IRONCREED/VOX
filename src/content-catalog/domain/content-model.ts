export const SUPPORTED_LOCALES = ['uk', 'en'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];
export type PublicationStatus = 'draft' | 'review' | 'published' | 'deprecated';

export interface LocalizedValue {
	uk: string;
	en: string;
}

export interface CategoryDefinition {
	id: string;
	order: number;
	icon: string;
	labels: LocalizedValue;
	descriptions: LocalizedValue;
}

export interface TagDefinition {
	id: string;
	order: number;
	labels: LocalizedValue;
}

export interface LocalizedTag {
	id: string;
	label: string;
}

export interface SystemNavigationDefinition {
	id: string;
	order: number;
	kind: 'home' | 'page' | 'disabled';
	icon: string;
	labels: LocalizedValue;
	badges?: LocalizedValue;
	pageId?: string;
}

export interface ZenodoPublication {
	provider: 'zenodo';
	recordId: string;
	title: string;
	doi: string;
	pdfFile?: string;
}

export interface ArticleMetadata {
	id: string;
	materialId: string;
	translationKey: string;
	locale: Locale;
	category: string;
	slug: string;
	title: string;
	description: string;
	memoryLine: string;
	folderLabel: string;
	authors: string[];
	authorMetadata?: ArticleAuthor[];
	type: string;
	tags: string[];
	edition: string;
	status: PublicationStatus;
	publishedAt: string;
	updatedAt: string;
	featured: boolean;
	conversationViewId: string;
	entryQuestionIds: string[];
	hintIds: string[];
	publication?: ZenodoPublication;
	series: ArticleSeriesMembership | null;
	presentationMode: 'standard' | 'scenario-log';
}

export interface ArticleSeriesMembership {
	seriesId: string;
	position: number;
}

export interface ArticleAuthor {
	id: string;
	displayName: string;
	role: string;
	url?: string;
}

export interface LocalizedArticle extends ArticleMetadata {
	body: string;
}

export interface ArticleSummary {
	id: string;
	kind: 'material' | 'series';
	materialId?: string;
	seriesId?: string;
	translationKey: string;
	title: string;
	description: string;
	folderLabel: string;
	category: string;
	categoryLabel: string;
	tags: string[];
	href: string;
	publishedAt: string;
	folderSheets?: number;
	latestTitle?: string;
	partCount?: number;
}

export interface LocalizedSeries {
	id: string;
	seriesId: string;
	translationKey: string;
	locale: Locale;
	slug: string;
	title: string;
	description: string;
	category: string;
	tags: string[];
	materialIds: string[];
	folderLabel: string;
	folderSheets: number;
	catalogMode: 'latest-part';
	latestMaterialId: string;
	latestTitle: string;
	latestDescription: string;
	publishedAt: string;
	updatedAt: string;
	status: PublicationStatus;
}

export interface ArticleSeriesContext {
	series: LocalizedSeries;
	position: number;
	total: number;
	previous?: ArticleSummary;
	next?: ArticleSummary;
}

export interface PaginatedArticles {
	items: ArticleSummary[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

export interface CatalogQuery {
	categoryId?: string;
	tagId?: string;
}

export interface InterfaceCopy {
	build: string;
	language: string;
	theme: string;
	lightTheme: string;
	darkTheme: string;
	homeTitle: string;
	homeDescription: string;
	latestMaterials: string;
	openMaterial: string;
	openSeries: string;
	materialSeries: string;
	latestPart: string;
	allParts: string;
	previousPart: string;
	nextPart: string;
	loadMore: string;
	loading: string;
	loadError: string;
	page: string;
	discuss: string;
	deepArticle: string;
	articleBody: string;
	tags: string;
	filterByTag: string;
	allTags: string;
	openOnZenodo: string;
	loadPdf: string;
	loadingPdf: string;
	closePdf: string;
	pdfLoadError: string;
	pdfFallback: string;
	companion: string;
	companionActive: string;
	companionRequiresJavaScript: string;
	suggestedQuestions: string;
	questionDepth: string;
	questionPath: string;
	questionRoot: string;
	backToParent: string;
	translationFallback: string;
	back: string;
	memoryLine: string;
	hint: string;
	closeHint: string;
	policyDirectory: string;
	nextQuip: string;
	corpusIndex: string;
	corpusIndexDescription: string;
	entityKind: string;
	allEntityKinds: string;
	searchEntities: string;
	noEntities: string;
	openEntity: string;
	openQuestion: string;
	questionAssociations: string;
	entityKinds: Record<PublicEntityKind, string>;
}

export type CompanionMotion = 'trace' | 'pulse' | 'reveal';

export interface CompanionQuestion {
	id: string;
	label: string;
	answer: string;
	motion: CompanionMotion;
	answerContract?: {
		shape: string;
		mustAddress: string[];
	};
}

export interface CompanionEdge {
	from: string;
	to: string;
	type: string;
	order: number;
	usageNote?: string;
}

export interface CompanionScenario {
	invitation: string;
	entryQuestionIds: string[];
	questions: CompanionQuestion[];
	edges: CompanionEdge[];
}

export type PublicEntityKind =
	| 'series'
	| 'page'
	| 'material'
	| 'question'
	| 'concept'
	| 'claim'
	| 'source'
	| 'protocol'
	| 'asset';

export interface PublicEntityIndexEntry {
	id: string;
	kind: PublicEntityKind;
	locale: Locale;
	label: string;
	summary: string;
	status: string;
	materialIds: string[];
	pageIds?: string[];
	href?: string;
	relatedEntries?: PublicEntityRelatedEntry[];
}

export interface PublicEntityRelatedEntry {
	id: string;
	kind: 'material' | 'page';
	label: string;
	href: string;
}

export type ContentPageType = 'about' | 'corpus-index' | 'policy';

export interface LocalizedContentPage {
	id: string;
	pageId: string;
	locale: Locale;
	slug: string;
	title: string;
	description: string;
	shortLabel: string;
	eyebrow: string;
	body: string;
	pageType: ContentPageType;
	status: PublicationStatus;
	conversationViewId?: string;
}

export type HintSource =
	| {
			kind: 'content-fragment';
			contentId: string;
			anchor: string;
	  }
	| {
			kind: 'url-fragment';
			url: string;
			selector: string;
	  }
	| {
			kind: 'html';
			html: string;
	  }
	| {
			kind: 'text';
			text: string;
	  };

export interface ContextualHint {
	id: string;
	locale: Locale;
	label: string;
	source: HintSource;
}

export interface NavigationItem {
	id: string;
	icon: string;
	label: string;
	href?: string;
	active: boolean;
	disabled: boolean;
	badge?: string;
}

export function isLocale(value: string): value is Locale {
	return SUPPORTED_LOCALES.includes(value as Locale);
}
