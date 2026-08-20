import { THEME_STORAGE_KEY } from '../theme-contract';
import {
	SIDEBAR_COLLAPSED_STORAGE_KEY,
	SIDEBAR_DEFAULT_WIDTH,
	SIDEBAR_MAX_WIDTH,
	SIDEBAR_MIN_WIDTH,
	SIDEBAR_WIDTH_STORAGE_KEY,
} from '../sidebar-contract';

const themeBootstrapScript = `(() => {
	try {
		const storedTheme = window.localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
		document.documentElement.dataset.theme = storedTheme === 'dark' ? 'dark' : 'light';
	} catch {
		document.documentElement.dataset.theme = 'light';
	}
	try {
		const storedWidth = Number(window.localStorage.getItem(${JSON.stringify(SIDEBAR_WIDTH_STORAGE_KEY)}));
		const width = Number.isFinite(storedWidth) && storedWidth >= ${SIDEBAR_MIN_WIDTH} && storedWidth <= ${SIDEBAR_MAX_WIDTH}
			? storedWidth
			: ${SIDEBAR_DEFAULT_WIDTH};
		document.documentElement.style.setProperty('--sidebar-width', width + 'px');
		document.documentElement.dataset.sidebar = window.localStorage.getItem(${JSON.stringify(SIDEBAR_COLLAPSED_STORAGE_KEY)}) === 'true'
			? 'collapsed'
			: 'expanded';
	} catch {
		document.documentElement.style.setProperty('--sidebar-width', '${SIDEBAR_DEFAULT_WIDTH}px');
		document.documentElement.dataset.sidebar = 'expanded';
	}
	document.documentElement.dataset.layoutControls = 'ready';
})();`;

export function ThemeBootstrap() {
	return <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />;
}
