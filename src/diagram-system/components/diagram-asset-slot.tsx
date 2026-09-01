import type { ReactNode } from 'react';
import type { LocalizedDiagramAsset } from '../domain/diagram-model';
import { DiagramFigure } from './diagram-figure';

interface DiagramAssetSlotProps {
	asset?: LocalizedDiagramAsset;
	brief: ReactNode;
	slotId: string;
}

export function DiagramAssetSlot({ asset, brief, slotId }: DiagramAssetSlotProps) {
	if (asset?.assetType === 'diagram' && asset.diagram) {
		return <DiagramFigure asset={asset} />;
	}
	return (
		<aside className="diagram-brief" data-asset-id={asset?.id}>
			<header>
				<small>IRON CREED / ASSET</small>
				<strong>{slotId}</strong>
			</header>
			<div>{brief}</div>
		</aside>
	);
}
