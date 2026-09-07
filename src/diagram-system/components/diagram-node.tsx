'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { DiagramDirection, DiagramNodeDeclaration } from '../domain/diagram-model';

type DiagramNodeViewData = DiagramNodeDeclaration & {
	layoutDirection: DiagramDirection;
};

export function DiagramNode({ data, selected }: NodeProps) {
	const node = data as unknown as DiagramNodeViewData;
	const targetPosition =
		node.layoutDirection === 'DOWN'
			? Position.Top
			: node.layoutDirection === 'UP'
				? Position.Bottom
				: node.layoutDirection === 'LEFT'
					? Position.Right
					: Position.Left;
	const sourcePosition =
		node.layoutDirection === 'DOWN'
			? Position.Bottom
			: node.layoutDirection === 'UP'
				? Position.Top
				: node.layoutDirection === 'LEFT'
					? Position.Left
					: Position.Right;
	return (
		<div
			aria-label={`${node.role}: ${node.label}`}
			className="ic-diagram-node"
			data-accent={node.accent ?? 'neutral'}
			data-role={node.role}
			data-selected={selected ? 'true' : 'false'}
		>
			<Handle position={targetPosition} type="target" />
			<small>{node.role}</small>
			<strong>{node.label}</strong>
			{node.description ? <span>{node.description}</span> : null}
			<Handle position={sourcePosition} type="source" />
		</div>
	);
}
