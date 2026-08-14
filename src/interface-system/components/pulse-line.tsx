interface PulseLineProps {
	compact?: boolean;
	inverted?: boolean;
}

export function PulseLine({ compact = false, inverted = false }: PulseLineProps) {
	const classNames = [
		'pulse-line',
		compact ? 'pulse-line--compact' : '',
		inverted ? 'pulse-line--inverted' : '',
	]
		.filter(Boolean)
		.join(' ');

	return (
		<span aria-hidden="true" className={classNames}>
			<span />
		</span>
	);
}
