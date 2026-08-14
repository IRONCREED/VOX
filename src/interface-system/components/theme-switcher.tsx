'use client';

import { useEffect, useState } from 'react';
import { THEME_COLOURS, THEME_STORAGE_KEY, type Theme } from '../theme-contract';

function isTheme(value: string | null): value is Theme {
	return value === 'light' || value === 'dark';
}

function applyTheme(theme: Theme) {
	document.documentElement.dataset.theme = theme;
	document
		.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
		?.setAttribute('content', THEME_COLOURS[theme]);
}

export function ThemeSwitcher({
	darkLabel,
	label,
	lightLabel,
}: {
	darkLabel: string;
	label: string;
	lightLabel: string;
}) {
	const [theme, setTheme] = useState<Theme>('light');

	useEffect(() => {
		let storedTheme: string | null = null;

		try {
			storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
		} catch {
			storedTheme = null;
		}

		const initialTheme = isTheme(storedTheme) ? storedTheme : 'light';
		const update = window.setTimeout(() => {
			applyTheme(initialTheme);
			setTheme(initialTheme);
		}, 0);

		return () => window.clearTimeout(update);
	}, []);

	function toggleTheme() {
		const nextTheme: Theme = theme === 'light' ? 'dark' : 'light';
		applyTheme(nextTheme);
		setTheme(nextTheme);

		try {
			window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
		} catch {
			// A private browser context may reject storage; the current page still keeps the choice.
		}
	}

	const currentLabel = theme === 'light' ? lightLabel : darkLabel;
	const nextLabel = theme === 'light' ? darkLabel : lightLabel;

	return (
		<button
			aria-label={`${label}: ${currentLabel}. ${nextLabel}`}
			aria-pressed={theme === 'dark'}
			className="theme-switcher"
			onClick={toggleTheme}
			title={`${label}: ${currentLabel}`}
			type="button"
		>
			<span aria-hidden="true" className="theme-switcher__glyph">
				<i />
			</span>
			<small>{currentLabel}</small>
		</button>
	);
}
