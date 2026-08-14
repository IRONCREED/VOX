import { THEME_STORAGE_KEY } from '../theme-contract';

const themeBootstrapScript = `(() => {
	try {
		const storedTheme = window.localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
		document.documentElement.dataset.theme = storedTheme === 'dark' ? 'dark' : 'light';
	} catch {
		document.documentElement.dataset.theme = 'light';
	}
})();`;

export function ThemeBootstrap() {
	return <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />;
}
