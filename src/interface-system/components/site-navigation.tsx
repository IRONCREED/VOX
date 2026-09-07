'use client';

import Link from 'next/link';
import {
	type KeyboardEvent as ReactKeyboardEvent,
	type PointerEvent as ReactPointerEvent,
	useEffect,
	useRef,
	useState,
} from 'react';
import type { Locale, NavigationItem } from '../../content-catalog/domain/content-model';
import {
	clampSidebarWidth,
	SIDEBAR_DEFAULT_WIDTH,
	SIDEBAR_MAX_WIDTH,
	SIDEBAR_MIN_WIDTH,
	SIDEBAR_WIDTH_STORAGE_KEY,
} from '../sidebar-contract';
import { SocialLinks } from './social-links';
import { SectionIcon } from './section-icon';

interface NavigationLink {
	href: string;
	label: string;
}

interface SiteNavigationProps {
	buildLabel: string;
	buildTitle: string;
	corpusIndexLink?: NavigationLink;
	items: NavigationItem[];
	locale: Locale;
	policyLinks: NavigationLink[];
	socialLabel: string;
}

const DRAG_THRESHOLD = 7;

const resizeLabels = {
	en: 'Resize navigation panel',
	uk: 'Змінити ширину панелі навігації',
} as const;

export function SiteNavigation({
	buildLabel,
	buildTitle,
	corpusIndexLink,
	items,
	locale,
	policyLinks,
	socialLabel,
}: SiteNavigationProps) {
	const navigationRef = useRef<HTMLElement>(null);
	const sidebarRef = useRef<HTMLElement>(null);
	const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
	const sidebarWidthRef = useRef(SIDEBAR_DEFAULT_WIDTH);
	const resizeGesture = useRef({ pointerId: -1, shellLeft: 0 });
	const gesture = useRef({
		pointerId: -1,
		startX: 0,
		startScrollLeft: 0,
		didDrag: false,
		suppressClickUntil: 0,
	});

	useEffect(() => {
		const frame = window.requestAnimationFrame(() => {
			const width = Number.parseFloat(
				window.getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width'),
			);
			if (Number.isFinite(width)) {
				const initialWidth = clampSidebarWidth(width);
				sidebarWidthRef.current = initialWidth;
				setSidebarWidth(initialWidth);
			}
		});

		return () => window.cancelAnimationFrame(frame);
	}, []);

	function applySidebarWidth(nextWidth: number, persist = false) {
		const width = clampSidebarWidth(Math.round(nextWidth));
		document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
		sidebarWidthRef.current = width;
		setSidebarWidth(width);
		if (persist) {
			try {
				window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(width));
			} catch {
				// The visual preference still applies when browser storage is unavailable.
			}
		}
	}

	function handleResizePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
		if (event.pointerType === 'touch' || event.button !== 0) return;
		const shell = sidebarRef.current?.closest<HTMLElement>('.interface-shell');
		if (!shell) return;

		resizeGesture.current = {
			pointerId: event.pointerId,
			shellLeft: shell.getBoundingClientRect().left,
		};
		event.currentTarget.setPointerCapture(event.pointerId);
		document.documentElement.dataset.sidebarResizing = 'true';
	}

	function handleResizePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
		if (resizeGesture.current.pointerId !== event.pointerId) return;
		applySidebarWidth(event.clientX - resizeGesture.current.shellLeft);
	}

	function finishResize(event: ReactPointerEvent<HTMLDivElement>) {
		if (resizeGesture.current.pointerId !== event.pointerId) return;
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
		resizeGesture.current.pointerId = -1;
		delete document.documentElement.dataset.sidebarResizing;
		applySidebarWidth(sidebarWidthRef.current, true);
	}

	function handleResizeKeyboard(event: ReactKeyboardEvent<HTMLDivElement>) {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		event.preventDefault();
		applySidebarWidth(sidebarWidth + (event.key === 'ArrowRight' ? 12 : -12), true);
	}

	function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
		if (event.pointerType === 'touch' || event.button !== 0) {
			return;
		}

		const navigation = navigationRef.current;
		if (!navigation) {
			return;
		}

		const isHorizontal = window.getComputedStyle(navigation).flexDirection === 'row';
		if (!isHorizontal || navigation.scrollWidth <= navigation.clientWidth) {
			return;
		}

		gesture.current = {
			pointerId: event.pointerId,
			startX: event.clientX,
			startScrollLeft: navigation.scrollLeft,
			didDrag: false,
			suppressClickUntil: 0,
		};
		navigation.setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
		const navigation = navigationRef.current;
		if (!navigation || gesture.current.pointerId !== event.pointerId) {
			return;
		}

		const movement = event.clientX - gesture.current.startX;
		if (Math.abs(movement) >= DRAG_THRESHOLD) {
			gesture.current.didDrag = true;
			navigation.classList.add('is-dragging');
		}

		if (gesture.current.didDrag) {
			navigation.scrollLeft = gesture.current.startScrollLeft - movement;
		}
	}

	function finishPointerGesture(event: ReactPointerEvent<HTMLElement>) {
		const navigation = navigationRef.current;
		if (!navigation || gesture.current.pointerId !== event.pointerId) {
			return;
		}

		if (navigation.hasPointerCapture(event.pointerId)) {
			navigation.releasePointerCapture(event.pointerId);
		}

		window.setTimeout(() => navigation.classList.remove('is-dragging'), 0);
		if (gesture.current.didDrag) {
			gesture.current.suppressClickUntil = performance.now() + 350;
		}
		gesture.current.pointerId = -1;
		gesture.current.didDrag = false;
	}

	function suppressDraggedClick(event: React.MouseEvent<HTMLElement>) {
		if (performance.now() > gesture.current.suppressClickUntil) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		gesture.current.suppressClickUntil = 0;
	}

	return (
		<aside aria-label="IRON CREED navigation" className="sidebar" ref={sidebarRef}>
			<nav
				className="primary-navigation"
				id="primary-navigation"
				onClickCapture={suppressDraggedClick}
				onPointerCancel={finishPointerGesture}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={finishPointerGesture}
				ref={navigationRef}
			>
				{items.map((item) =>
					item.disabled ? (
						<span aria-disabled="true" className="navigation-item is-disabled" key={item.id}>
							<span aria-hidden="true" className="nav-icon">
								<SectionIcon sectionId={item.id} />
							</span>
							<span>{item.label}</span>
							{item.badge ? <small>{item.badge}</small> : null}
						</span>
					) : (
						<Link
							aria-current={item.active ? 'page' : undefined}
							className={`navigation-item${item.active ? ' is-active' : ''}`}
							href={item.href ?? '/'}
							key={item.id}
						>
							<span aria-hidden="true" className="nav-icon">
								<SectionIcon sectionId={item.id} />
							</span>
							<span>{item.label}</span>
						</Link>
					),
				)}
			</nav>

			<SocialLinks label={socialLabel} locale={locale} />

			<div className="build-identity">
				<span>{buildTitle}</span>
				<a
					className="build-identity__release"
					href="https://github.com/IRONCREED/VOX"
					rel="noreferrer noopener"
					target="_blank"
					title={`${buildTitle}: ${buildLabel}`}
				>
					<strong>{buildLabel}</strong>
					<small aria-hidden="true">↗</small>
				</a>
				{corpusIndexLink ? (
					<Link className="build-identity__index" href={corpusIndexLink.href}>
						{corpusIndexLink.label}
					</Link>
				) : null}
				{policyLinks.length > 0 ? (
					<nav aria-label="Public policies" className="build-identity__policies">
						{policyLinks.map((policy) => (
							<Link href={policy.href} key={policy.href}>
								{policy.label}
							</Link>
						))}
					</nav>
				) : null}
			</div>

			<div
				aria-label={resizeLabels[locale]}
				aria-orientation="vertical"
				aria-valuemax={SIDEBAR_MAX_WIDTH}
				aria-valuemin={SIDEBAR_MIN_WIDTH}
				aria-valuenow={sidebarWidth}
				className="sidebar-resize-handle"
				onKeyDown={handleResizeKeyboard}
				onPointerCancel={finishResize}
				onPointerDown={handleResizePointerDown}
				onPointerMove={handleResizePointerMove}
				onPointerUp={finishResize}
				role="separator"
				tabIndex={0}
			/>
		</aside>
	);
}
