import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const targets = (process.env.DIAGRAM_PUBLICATION_TARGETS ?? '')
	.split(',')
	.map((target) => target.trim())
	.filter(Boolean);

test.describe('diagram publication exports', () => {
	test.skip(targets.length === 0, 'No concrete diagram publication targets are declared yet.');

	for (const target of targets) {
		test(`exports ${target}`, async ({ page }) => {
			await page.goto(target);
			const figure = page.locator('.ic-diagram[data-asset-id]').first();
			await expect(figure).toBeVisible();
			const assetId = await figure.getAttribute('data-asset-id');
			expect(assetId).toBeTruthy();
			await mkdir('work/diagram-exports', { recursive: true });
			await figure.screenshot({
				animations: 'disabled',
				path: path.join('work/diagram-exports', `${assetId}.png`),
			});
		});
	}
});
