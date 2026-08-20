import assert from 'node:assert/strict';
import test from 'node:test';
import { readCanonicalJson } from '../testing-interface/site-driver.mjs';

test('ICW-HIST-0001: loader uses only registered one-or-two-line hymn fragments', async () => {
	const quotes = await readCanonicalJson('content/config/loader-quotes.json');

	assert.ok(Array.isArray(quotes));
	assert.ok(quotes.length > 0);

	for (const quote of quotes) {
		assert.ok(Array.isArray(quote));
		assert.ok(quote.length >= 1 && quote.length <= 2);
		assert.ok(quote.every((line) => typeof line === 'string' && line.trim().length > 0));
		assert.doesNotMatch(quote.join(' '), /\bNOIR\b/i);
	}

	assert.ok(
		quotes.some((quote) => quote.length === 2 && quote[0] === 'So is' && quote[1] === 'My core.'),
	);
});
