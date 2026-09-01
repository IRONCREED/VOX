import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests/diagrams',
	outputDir: './work/playwright-diagrams',
	fullyParallel: false,
	retries: 0,
	use: {
		baseURL: process.env.DIAGRAM_SITE_URL ?? 'http://127.0.0.1:3000',
		colorScheme: 'light',
		deviceScaleFactor: 2,
		viewport: { width: 1440, height: 1024 },
	},
});
