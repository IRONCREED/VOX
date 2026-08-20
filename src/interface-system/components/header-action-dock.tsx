'use client';

import { useEffect, useState } from 'react';

export interface HeaderAction {
	href: string;
	label: string;
	external?: boolean;
}

export interface HeaderContextActions {
	deep?: HeaderAction;
	discuss: HeaderAction;
	markerId: string;
}

interface HeaderActionDockProps {
	actions?: HeaderContextActions;
}

export function HeaderActionDock({ actions }: HeaderActionDockProps) {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (!actions) return;
		const contextActions = actions;

		let frame = 0;
		function update() {
			window.cancelAnimationFrame(frame);
			frame = window.requestAnimationFrame(() => {
				const marker = document.getElementById(contextActions.markerId);
				const header = document.querySelector<HTMLElement>('.system-header');
				setVisible(
					Boolean(
						marker &&
							header &&
							marker.getClientRects().length > 0 &&
							marker.getBoundingClientRect().bottom <= header.getBoundingClientRect().bottom,
					),
				);
			});
		}

		update();
		document.addEventListener('scroll', update, true);
		window.addEventListener('resize', update);
		return () => {
			window.cancelAnimationFrame(frame);
			document.removeEventListener('scroll', update, true);
			window.removeEventListener('resize', update);
		};
	}, [actions]);

	if (!actions || !visible) return null;

	return (
		<nav aria-label="Material actions" className="header-action-dock">
			<a
				aria-label={actions.discuss.label}
				href={actions.discuss.href}
				title={actions.discuss.label}
			>
				<span aria-hidden="true">⌁</span>
			</a>
			{actions.deep ? (
				<a
					aria-label={actions.deep.label}
					href={actions.deep.href}
					rel={actions.deep.external ? 'noreferrer noopener' : undefined}
					target={actions.deep.external ? '_blank' : undefined}
					title={actions.deep.label}
				>
					<span aria-hidden="true">▭</span>
				</a>
			) : null}
		</nav>
	);
}
