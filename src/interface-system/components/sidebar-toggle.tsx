'use client';

import { useEffect, useState } from 'react';
import type { Locale } from '../../content-catalog/domain/content-model';
import { SIDEBAR_COLLAPSED_STORAGE_KEY } from '../sidebar-contract';

interface SidebarToggleProps {
	locale: Locale;
}

const labels = {
	en: {
		collapse: 'Collapse navigation panel',
		expand: 'Expand navigation panel',
	},
	uk: {
		collapse: 'Згорнути панель навігації',
		expand: 'Розгорнути панель навігації',
	},
} as const;

function isCollapsed() {
	return document.documentElement.dataset.sidebar === 'collapsed';
}

export function SidebarToggle({ locale }: SidebarToggleProps) {
	const [collapsed, setCollapsed] = useState(false);

	useEffect(() => {
		function synchronize() {
			setCollapsed(isCollapsed());
		}

		const frame = window.requestAnimationFrame(synchronize);
		window.addEventListener('ironcreed:sidebar-change', synchronize);
		return () => {
			window.cancelAnimationFrame(frame);
			window.removeEventListener('ironcreed:sidebar-change', synchronize);
		};
	}, []);

	function toggleSidebar() {
		const next = !collapsed;
		document.documentElement.dataset.sidebar = next ? 'collapsed' : 'expanded';
		try {
			window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next));
		} catch {
			// The visual preference still applies when browser storage is unavailable.
		}
		setCollapsed(next);
		window.dispatchEvent(new Event('ironcreed:sidebar-change'));
	}

	const label = collapsed ? labels[locale].expand : labels[locale].collapse;

	return (
		<button
			aria-controls="primary-navigation"
			aria-expanded={!collapsed}
			aria-label={label}
			className="sidebar-toggle"
			onClick={toggleSidebar}
			title={label}
			type="button"
		>
			<span aria-hidden="true" className="sidebar-toggle__glyph" />
		</button>
	);
}
