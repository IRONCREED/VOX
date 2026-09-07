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
import { useEffect, useMemo, useRef, useState } from 'react';
import { layoutDiagram } from '../application/layout-diagram';
import type {
	DiagramDeclaration,
	DiagramDirection,
	DiagramNodeDeclaration,
} from '../domain/diagram-model';
import { DiagramNode } from './diagram-node';

interface GraphDiagramProps {
	diagram: DiagramDeclaration;
	interactive: boolean;
}

interface DiagramLayoutState {
	diagram: DiagramDeclaration;
	direction: DiagramDirection;
	positions: Map<string, { x: number; y: number }>;
}

const nodeTypes = { diagramNode: DiagramNode };

function GraphDiagramSurface({ diagram, interactive }: GraphDiagramProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [compactLayout, setCompactLayout] = useState<boolean | null>(null);
	const [layoutState, setLayoutState] = useState<DiagramLayoutState | null>(null);
	const [focusedNode, setFocusedNode] = useState<string | null>(null);
	const layoutDirection: DiagramDirection =
		diagram.direction === 'RIGHT' && compactLayout ? 'DOWN' : (diagram.direction ?? 'RIGHT');
	const positions =
		layoutState?.diagram === diagram && layoutState.direction === layoutDirection
			? layoutState.positions
			: null;

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		const updateLayoutMode = () => setCompactLayout(container.clientWidth < 860);
		updateLayoutMode();
		const observer = new ResizeObserver(updateLayoutMode);
		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		if (compactLayout === null) return;
		let active = true;
		void layoutDiagram({ ...diagram, direction: layoutDirection }).then((layout) => {
			if (active) {
				setLayoutState({
					diagram,
					direction: layoutDirection,
					positions: new Map(layout.map((node) => [node.id, node])),
				});
			}
		});
		return () => {
			active = false;
		};
	}, [compactLayout, diagram, layoutDirection]);

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
		position: positions?.get(node.id) ?? { x: 0, y: 0 },
		data: { ...node, layoutDirection },
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
		<div
			className="ic-diagram-graph"
			data-interactive={interactive ? 'true' : 'false'}
			ref={containerRef}
		>
			{positions ? (
				<ReactFlow
					edges={edges}
					elementsSelectable={interactive}
					fitView
					fitViewOptions={{ maxZoom: 0.92, padding: 0.18 }}
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
			) : (
				<div aria-busy="true" className="ic-diagram-loading" />
			)}
		</div>
	);
}

export function GraphDiagram(props: GraphDiagramProps) {
	return (
		<ReactFlowProvider>
			<GraphDiagramSurface {...props} />
		</ReactFlowProvider>
	);
}
