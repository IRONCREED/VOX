'use client';

import { useSiteAudio } from './site-audio-provider';

export function AnthemToggle({
	loadingLabel,
	pauseLabel,
	playLabel,
	unavailableLabel,
	showLabel = false,
}: {
	loadingLabel: string;
	pauseLabel: string;
	playLabel: string;
	unavailableLabel: string;
	showLabel?: boolean;
}) {
	const { activeTrack, status, toggle } = useSiteAudio();
	const isLoading = status === 'loading';
	const isUnavailable = status === 'unavailable';
	const isActive = status === 'playing' || isLoading;
	const actionLabel = isUnavailable
		? unavailableLabel
		: isLoading
			? loadingLabel
			: status === 'playing'
				? pauseLabel
				: playLabel;

	return (
		<button
			aria-label={`${actionLabel}: ${activeTrack.title}`}
			aria-pressed={isActive}
			className={`anthem-toggle${showLabel ? ' anthem-toggle--labelled' : ''}`}
			onClick={() => void toggle()}
			title={`${actionLabel}: ${activeTrack.title}`}
			type="button"
		>
			<span aria-hidden="true" className="anthem-toggle__glyph">
				{isActive ? (
					<>
						<i />
						<i />
					</>
				) : (
					<i />
				)}
			</span>
			{showLabel ? <span>{actionLabel}</span> : null}
		</button>
	);
}
