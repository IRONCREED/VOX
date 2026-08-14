export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'ironcreed:colour-theme';

export const THEME_COLOURS: Record<Theme, string> = {
	light: '#edf0ef',
	dark: '#0b1115',
};
