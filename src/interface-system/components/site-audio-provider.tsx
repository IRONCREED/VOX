'use client';

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from 'react';
import audioSource from '../../../content/config/audio.json';

type AudioStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'unavailable';

interface AudioSource {
	src: string;
	type: string;
}

interface AudioTrack {
	id: string;
	title: string;
	artist: string;
	shareUrl: string;
	sources: AudioSource[];
}

interface SiteAudioContextValue {
	activeTrack: AudioTrack;
	status: AudioStatus;
	toggle: () => Promise<void>;
}

function resolveActiveTrack(): AudioTrack {
	const track = audioSource.tracks.find(
		(candidate) => candidate.id === audioSource.activeTrackId,
	) as AudioTrack | undefined;

	if (!track || track.sources.length === 0) {
		throw new Error('The active site-audio track is missing or has no media source.');
	}
	return track;
}

const activeTrack = resolveActiveTrack();

const SiteAudioContext = createContext<SiteAudioContextValue | null>(null);

export function SiteAudioProvider({ children }: { children: ReactNode }) {
	const audio = useRef<HTMLAudioElement>(null);
	const [status, setStatus] = useState<AudioStatus>('idle');

	const toggle = useCallback(async () => {
		const player = audio.current;
		if (!player) return;

		if (!player.paused) {
			player.pause();
			return;
		}
		if (status === 'unavailable') player.load();

		setStatus('loading');
		try {
			await player.play();
		} catch {
			setStatus('unavailable');
		}
	}, [status]);

	const value = useMemo<SiteAudioContextValue>(
		() => ({ activeTrack, status, toggle }),
		[status, toggle],
	);

	return (
		<SiteAudioContext.Provider value={value}>
			{children}
			<audio
				aria-hidden="true"
				onEnded={() => setStatus('paused')}
				onError={() => setStatus('unavailable')}
				onPause={() => setStatus('paused')}
				onPlay={() => setStatus('playing')}
				onWaiting={() => setStatus('loading')}
				preload="none"
				ref={audio}
			>
				{activeTrack.sources.map((source) => (
					<source key={source.src} src={source.src} type={source.type} />
				))}
			</audio>
		</SiteAudioContext.Provider>
	);
}

export function useSiteAudio(): SiteAudioContextValue {
	const context = useContext(SiteAudioContext);
	if (!context) {
		throw new Error('useSiteAudio must be used within SiteAudioProvider.');
	}
	return context;
}
