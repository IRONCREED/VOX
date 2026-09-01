'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { DiagramNodeDeclaration } from '../domain/diagram-model';

export function DiagramNode({ data, selected }: NodeProps) {
	const node = data as unknown as DiagramNodeDeclaration;
	return (
		<div
			aria-label={`${node.role}: ${node.label}`}
			className="ic-diagram-node"
			data-accent={node.accent ?? 'neutral'}
			data-role={node.role}
			data-selected={selected ? 'true' : 'false'}
		>
			<Handle position={Position.Left} type="target" />
			<small>{node.role}</small>
			<strong>{node.label}</strong>
			{node.description ? <span>{node.description}</span> : null}
			<Handle position={Position.Right} type="source" />
		</div>
	);
}
