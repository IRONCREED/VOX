'use client';

import dynamic from 'next/dynamic';
import type { LocalizedDiagramAsset } from '../domain/diagram-model';
import { MatrixDiagram } from './matrix-diagram';

const GraphDiagram = dynamic(
	() => import('./graph-diagram').then((module) => module.GraphDiagram),
	{
		loading: () => <div aria-busy="true" className="ic-diagram-loading" />,
		ssr: false,
	},
);

export function DiagramFigure({ asset }: { asset: LocalizedDiagramAsset }) {
	if (!asset.diagram || !asset.publication) return null;
	const interactive = asset.diagram.representations.includes('interactive');
	return (
		<figure
			aria-label={asset.publication.alt}
			className="ic-diagram"
			data-asset-id={asset.id}
			data-preset={asset.diagram.preset}
			data-projection={asset.diagram.projection}
			title={asset.publication.title}
		>
			<header>
				<small>{asset.diagram.projection}</small>
				<strong>{asset.title}</strong>
			</header>
			{asset.diagram.renderer === 'matrix' ? (
				<MatrixDiagram diagram={asset.diagram} />
			) : (
				<GraphDiagram diagram={asset.diagram} interactive={interactive} />
			)}
			<figcaption>
				<span>{asset.publication.caption}</span>
				<small>{asset.publication.provenance}</small>
			</figcaption>
		</figure>
	);
}
