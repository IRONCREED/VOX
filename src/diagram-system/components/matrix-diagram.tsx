import type { CSSProperties } from 'react';
import type { DiagramDeclaration } from '../domain/diagram-model';

export function MatrixDiagram({ diagram }: { diagram: DiagramDeclaration }) {
	const sources = diagram.nodes.filter((node) => node.role === 'source');
	const rows = diagram.nodes.filter((node) => node.role !== 'source');
	const columnCount = Math.max(sources.length, 1);
	const gridStyle = {
		'--ic-matrix-columns': columnCount,
	} as CSSProperties;

	return (
		<div className="ic-diagram-matrix" role="table" style={gridStyle}>
			<div className="ic-diagram-matrix__row ic-diagram-matrix__row--head" role="row">
				<span aria-hidden="true" />
				{sources.map((source) => (
					<strong key={source.id} role="columnheader">
						{source.label}
					</strong>
				))}
			</div>
			{rows.map((row) => (
				<div className="ic-diagram-matrix__row" key={row.id} role="row">
					<strong role="rowheader">{row.label}</strong>
					{sources.map((source) => {
						const relation = diagram.relations.find(
							(candidate) => candidate.from === source.id && candidate.to === row.id,
						);
						return (
							<span
								data-relation-type={relation?.type ?? 'none'}
								key={`${row.id}-${source.id}`}
								role="cell"
							>
								{relation?.label ?? relation?.type ?? '—'}
							</span>
						);
					})}
				</div>
			))}
		</div>
	);
}
