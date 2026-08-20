export const SIDEBAR_COLLAPSED_STORAGE_KEY = 'ironcreed.sidebar.collapsed';
export const SIDEBAR_WIDTH_STORAGE_KEY = 'ironcreed.sidebar.width';
export const SIDEBAR_DEFAULT_WIDTH = 280;
export const SIDEBAR_MIN_WIDTH = 220;
export const SIDEBAR_MAX_WIDTH = 420;

export function clampSidebarWidth(value: number) {
	return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, value));
}
