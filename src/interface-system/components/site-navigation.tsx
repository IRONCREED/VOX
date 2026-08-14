'use client';

import Link from 'next/link';
import { type PointerEvent as ReactPointerEvent, useRef } from 'react';
import type { NavigationItem } from '../../content-catalog/domain/content-model';

interface NavigationLink {
	href: string;
	label: string;
}

interface SiteNavigationProps {
	buildLabel: string;
	buildTitle: string;
	corpusIndexLink?: NavigationLink;
	items: NavigationItem[];
	policyLinks: NavigationLink[];
}

const DRAG_THRESHOLD = 7;

export function SiteNavigation({
	buildLabel,
	buildTitle,
	corpusIndexLink,
	items,
	policyLinks,
}: SiteNavigationProps) {
	const navigationRef = useRef<HTMLElement>(null);
	const gesture = useRef({
		pointerId: -1,
		startX: 0,
		startScrollLeft: 0,
		didDrag: false,
		suppressClickUntil: 0,
	});

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
		<aside aria-label="IRON CREED navigation" className="sidebar">
			<nav
				className="primary-navigation"
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
								{item.icon}
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
								{item.icon}
							</span>
							<span>{item.label}</span>
						</Link>
					),
				)}
			</nav>

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
		</aside>
	);
}
