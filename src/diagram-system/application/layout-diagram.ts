import ELK, { type ElkExtendedEdge, type ElkNode } from 'elkjs/lib/elk.bundled.js';
import type { DiagramDeclaration } from '../domain/diagram-model';

const elk = new ELK();
const NODE_WIDTH = 220;
const NODE_HEIGHT = 92;

export interface PositionedDiagramNode {
	id: string;
	x: number;
	y: number;
}

export async function layoutDiagram(diagram: DiagramDeclaration): Promise<PositionedDiagramNode[]> {
	const overrides = new Map(
		(diagram.layoutOverrides ?? []).map((override) => [override.nodeId, override]),
	);
	const graph: ElkNode = {
		id: 'root',
		layoutOptions: {
			'elk.algorithm': 'layered',
			'elk.direction': diagram.direction ?? 'RIGHT',
			'elk.edgeRouting': 'ORTHOGONAL',
			'elk.layered.spacing.nodeNodeBetweenLayers': '72',
			'elk.spacing.nodeNode': '40',
		},
		children: diagram.nodes.map((node) => ({
			id: node.id,
			width: NODE_WIDTH,
			height: NODE_HEIGHT,
		})),
		edges: diagram.relations.map(
			(relation): ElkExtendedEdge => ({
				id: relation.id,
				sources: [relation.from],
				targets: [relation.to],
			}),
		),
	};
	const result = await elk.layout(graph);
	return (result.children ?? []).map((node) => {
		const override = overrides.get(node.id);
		return {
			id: node.id,
			x: override?.x ?? node.x ?? 0,
			y: override?.y ?? node.y ?? 0,
		};
	});
}
