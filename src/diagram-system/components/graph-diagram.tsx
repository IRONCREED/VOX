'use client';

import {
	Background,
	Controls,
	MarkerType,
	ReactFlow,
	ReactFlowProvider,
	type Edge,
	type Node,
} from '@xyflow/react';
import { useEffect, useMemo, useState } from 'react';
import { layoutDiagram } from '../application/layout-diagram';
import type { DiagramDeclaration, DiagramNodeDeclaration } from '../domain/diagram-model';
import { DiagramNode } from './diagram-node';

interface GraphDiagramProps {
	diagram: DiagramDeclaration;
	interactive: boolean;
}

const nodeTypes = { diagramNode: DiagramNode };

function GraphDiagramSurface({ diagram, interactive }: GraphDiagramProps) {
	const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
	const [focusedNode, setFocusedNode] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		void layoutDiagram(diagram).then((layout) => {
			if (active) setPositions(new Map(layout.map((node) => [node.id, node])));
		});
		return () => {
			active = false;
		};
	}, [diagram]);

	const relatedEdges = useMemo(
		() =>
			new Set(
				diagram.relations
					.filter((relation) => relation.from === focusedNode || relation.to === focusedNode)
					.map((relation) => relation.id),
			),
		[diagram.relations, focusedNode],
	);
	const nodes: Node[] = diagram.nodes.map((node: DiagramNodeDeclaration) => ({
		id: node.id,
		type: 'diagramNode',
		position: positions.get(node.id) ?? { x: 0, y: 0 },
		data: { ...node },
		draggable: false,
		selectable: interactive,
		focusable: interactive,
	}));
	const edges: Edge[] = diagram.relations.map((relation) => ({
		id: relation.id,
		source: relation.from,
		target: relation.to,
		label: relation.label,
		type: 'smoothstep',
		markerEnd: { type: MarkerType.ArrowClosed },
		className: `ic-diagram-edge ic-diagram-edge--${relation.type}${relatedEdges.has(relation.id) ? ' ic-diagram-edge--active' : ''}`,
		data: { relationType: relation.type },
	}));

	return (
		<>
			<div className="ic-diagram-graph" data-interactive={interactive ? 'true' : 'false'}>
				<ReactFlow
					edges={edges}
					elementsSelectable={interactive}
					fitView
					fitViewOptions={{ padding: 0.18 }}
					minZoom={0.28}
					nodes={nodes}
					nodeTypes={nodeTypes}
					nodesConnectable={false}
					nodesDraggable={false}
					onNodeClick={interactive ? (_, node) => setFocusedNode(node.id) : undefined}
					onPaneClick={interactive ? () => setFocusedNode(null) : undefined}
					panOnDrag={interactive}
					proOptions={{ hideAttribution: true }}
					zoomOnScroll={interactive}
				>
					<Background gap={24} size={1} />
					{interactive ? <Controls showInteractive={false} /> : null}
				</ReactFlow>
			</div>
			<div className="sr-only">
				<ul>
					{diagram.nodes.map((node) => (
						<li
							key={node.id}
						>{`${node.role}: ${node.label}${node.description ? `. ${node.description}` : ''}`}</li>
					))}
				</ul>
				<ul>
					{diagram.relations.map((relation) => (
						<li key={relation.id}>{`${relation.from} ${relation.type} ${relation.to}`}</li>
					))}
				</ul>
			</div>
		</>
	);
}

export function GraphDiagram(props: GraphDiagramProps) {
	return (
		<ReactFlowProvider>
			<GraphDiagramSurface {...props} />
		</ReactFlowProvider>
	);
}
