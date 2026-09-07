import type { LocalizedMaterialCycle } from '../../content-catalog/domain/content-model';

export function MaterialCycle({ cycle }: { cycle: LocalizedMaterialCycle }) {
	return (
		<section className="about-cycle" aria-labelledby="material-cycle-title">
			<h2 id="material-cycle-title">{cycle.title}</h2>
			<ol className="about-cycle__steps">
				{cycle.steps.map((step) => (
					<li key={step.id}>
						<small>{String(step.order).padStart(2, '0')}</small>
						<strong>{step.title}</strong>
						<p>{step.description}</p>
					</li>
				))}
			</ol>
			<div className="material-cycle-table article-document">
				<table>
					<thead>
						<tr>
							{cycle.tableLabels.map((label) => (
								<th key={label} scope="col">
									{label}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{cycle.examples.map((example) => (
							<tr key={example.id}>
								<th scope="row">{example.initiator}</th>
								<td>
									<a href={example.source.href}>{example.source.label}</a>
								</td>
								<td>
									<a href={example.result.href}>{example.result.label}</a>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<p className="about-cycle__conclusion">{cycle.conclusion}</p>
		</section>
	);
}
