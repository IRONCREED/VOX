import { BrandMark } from './brand-mark';

interface ProtocolFolderProps {
	label: string;
	interactive?: boolean;
	sheets?: number;
}

export function ProtocolFolder({ label, interactive = false, sheets = 0 }: ProtocolFolderProps) {
	return (
		<div
			aria-label={label}
			className={`protocol-folder${interactive ? ' protocol-folder--interactive' : ''}`}
			role="img"
		>
			<div className="protocol-folder__axis protocol-folder__axis--horizontal" />
			<div className="protocol-folder__axis protocol-folder__axis--vertical" />
			<div className="protocol-folder__orbit protocol-folder__orbit--outer" />
			<div className="protocol-folder__orbit protocol-folder__orbit--inner" />
			{Array.from({ length: Math.min(2, Math.max(0, sheets)) }, (_, index) => (
				<div
					aria-hidden="true"
					className={`protocol-folder__sheet protocol-folder__sheet--${index + 1}`}
					key={index}
				/>
			))}
			<div className="protocol-folder__document">
				<BrandMark variant="folder" />
				<p>{label}</p>
				<span>KNOWLEDGE IS CONTINUITY</span>
			</div>
		</div>
	);
}
