import type { DiagramDeclaration } from '../domain/diagram-model';

export function MatrixDiagram({ diagram }: { diagram: DiagramDeclaration }) {
	return (
		<div className="ic-diagram-matrix" role="table">
			<div className="ic-diagram-matrix__row ic-diagram-matrix__row--head" role="row">
				<span role="columnheader">Node</span>
				<span role="columnheader">Role</span>
				<span role="columnheader">Relations</span>
			</div>
			{diagram.nodes.map((node) => (
				<div className="ic-diagram-matrix__row" key={node.id} role="row">
					<strong role="cell">{node.label}</strong>
					<span role="cell">{node.role}</span>
					<span role="cell">
						{diagram.relations
							.filter((relation) => relation.from === node.id || relation.to === node.id)
							.map((relation) => relation.type)
							.join(' · ') || '—'}
					</span>
				</div>
			))}
		</div>
	);
}
