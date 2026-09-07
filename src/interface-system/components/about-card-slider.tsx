'use client';

import {
	Children,
	type KeyboardEvent,
	type PointerEvent,
	type ReactNode,
	useEffect,
	useRef,
	useState,
	useSyncExternalStore,
} from 'react';

interface AboutCardSliderProps {
	children: ReactNode;
	label: string;
	nextLabel: string;
	previousLabel: string;
}

const SWIPE_THRESHOLD = 46;
const subscribeToHydration = () => () => undefined;

export function AboutCardSlider({
	children,
	label,
	nextLabel,
	previousLabel,
}: AboutCardSliderProps) {
	const slides = Children.toArray(children);
	const [activeIndex, setActiveIndex] = useState(0);
	const enhanced = useSyncExternalStore(
		subscribeToHydration,
		() => true,
		() => false,
	);
	const [viewportHeight, setViewportHeight] = useState<number>();
	const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
	const pointerStart = useRef<number | undefined>(undefined);

	useEffect(() => {
		if (!enhanced) return;
		const activeSlide = slideRefs.current[activeIndex];
		if (!activeSlide) return;

		const updateHeight = () =>
			setViewportHeight(Math.ceil(activeSlide.getBoundingClientRect().height));
		updateHeight();
		const observer = new ResizeObserver(updateHeight);
		observer.observe(activeSlide);
		window.addEventListener('resize', updateHeight);

		return () => {
			observer.disconnect();
			window.removeEventListener('resize', updateHeight);
		};
	}, [activeIndex, enhanced]);

	function showPrevious() {
		setActiveIndex((current) => (current === 0 ? slides.length - 1 : current - 1));
	}

	function showNext() {
		setActiveIndex((current) => (current + 1) % slides.length);
	}

	function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			showPrevious();
		}
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			showNext();
		}
	}

	function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
		if (!event.isPrimary) return;
		pointerStart.current = event.clientX;
	}

	function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
		if (pointerStart.current === undefined) return;
		const distance = event.clientX - pointerStart.current;
		pointerStart.current = undefined;
		if (Math.abs(distance) < SWIPE_THRESHOLD) return;
		if (distance > 0) {
			showPrevious();
		} else {
			showNext();
		}
	}

	return (
		<div
			aria-label={label}
			aria-roledescription={enhanced ? 'carousel' : undefined}
			className={`about-card-slider${enhanced ? ' is-enhanced' : ''}`}
			onKeyDown={handleKeyDown}
			role={enhanced ? 'region' : undefined}
		>
			<div
				className="about-card-slider__viewport"
				onPointerCancel={() => {
					pointerStart.current = undefined;
				}}
				onPointerDown={handlePointerDown}
				onPointerUp={handlePointerUp}
				style={enhanced && viewportHeight ? { height: viewportHeight } : undefined}
			>
				<div
					className="about-service__entries about-card-slider__track"
					style={enhanced ? { transform: `translateX(-${activeIndex * 100}%)` } : undefined}
				>
					{slides.map((slide, index) => (
						<div
							aria-hidden={enhanced && index !== activeIndex ? true : undefined}
							aria-label={enhanced ? `${index + 1} / ${slides.length}` : undefined}
							aria-roledescription={enhanced ? 'slide' : undefined}
							className="about-card-slider__slide"
							inert={enhanced && index !== activeIndex}
							key={index}
							ref={(node) => {
								slideRefs.current[index] = node;
							}}
							role={enhanced ? 'group' : undefined}
						>
							{slide}
						</div>
					))}
				</div>

				{enhanced && slides.length > 1 ? (
					<div className="about-card-slider__controls">
						<button aria-label={previousLabel} onClick={showPrevious} type="button">
							<span aria-hidden="true">←</span>
						</button>
						<output aria-live="polite">
							{String(activeIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
						</output>
						<button aria-label={nextLabel} onClick={showNext} type="button">
							<span aria-hidden="true">→</span>
						</button>
					</div>
				) : null}
			</div>
		</div>
	);
}
