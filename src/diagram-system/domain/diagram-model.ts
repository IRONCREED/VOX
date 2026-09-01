export const DIAGRAM_PROJECTIONS = [
	'flow',
	'lifecycle',
	'gate',
	'lineage',
	'topology',
	'navigator',
	'warden',
	'matrix',
	'comparison',
	'hero',
] as const;

export const DIAGRAM_NODE_ROLES = [
	'artifact',
	'actor',
	'process',
	'decision',
	'state',
	'source',
	'boundary',
	'human-decision',
] as const;

export const DIAGRAM_RELATION_ROLES = [
	'requires',
	'produces',
	'validates',
	'rejects',
	'derives',
	'supersedes',
	'executes',
	'returns',
	'references',
] as const;

export type DiagramProjectionType = (typeof DIAGRAM_PROJECTIONS)[number];
export type DiagramNodeRole = (typeof DIAGRAM_NODE_ROLES)[number];
export type DiagramRelationRole = (typeof DIAGRAM_RELATION_ROLES)[number];
export type DiagramRenderer = 'graph' | 'matrix' | 'svg';
export type DiagramRepresentation = 'interactive' | 'publication';
export type DiagramDirection = 'RIGHT' | 'DOWN' | 'LEFT' | 'UP';
export type DiagramAccent = 'active' | 'confirmed' | 'rejected' | 'human' | 'neutral';

export interface DiagramNodeDeclaration {
	id: string;
	entityId?: string;
	role: DiagramNodeRole;
	label: string;
	description?: string;
	accent?: DiagramAccent;
	group?: string;
}

export interface DiagramRelationDeclaration {
	id: string;
	relationId?: string;
	from: string;
	to: string;
	type: DiagramRelationRole;
	label?: string;
}

export interface DiagramLayoutOverride {
	nodeId: string;
	x: number;
	y: number;
}

export interface DiagramDeclaration {
	source: string;
	projection: DiagramProjectionType;
	renderer: DiagramRenderer;
	preset: string;
	direction?: DiagramDirection;
	representations: DiagramRepresentation[];
	mode?: string;
	nodes: DiagramNodeDeclaration[];
	relations: DiagramRelationDeclaration[];
	activeEntityIds?: string[];
	layoutOverrides?: DiagramLayoutOverride[];
}

export interface LocalizedDiagramAsset {
	id: string;
	locale: 'uk' | 'en';
	assetType: 'editorial-request' | 'diagram' | string;
	title: string;
	summary: string;
	license: string | null;
	provenance: string;
	diagram?: DiagramDeclaration;
	publication?: {
		alt: string;
		title: string;
		caption: string;
		provenance: string;
	};
}
