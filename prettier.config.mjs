/** @type {import("prettier").Config} */
const config = {
	arrowParens: 'always',
	bracketSpacing: true,
	endOfLine: 'lf',
	printWidth: 100,
	proseWrap: 'preserve',
	semi: true,
	singleQuote: true,
	tabWidth: 2,
	trailingComma: 'all',
	useTabs: true,
	overrides: [
		{
			files: 'semantic-core/**/*.yaml',
			options: { parser: 'json' },
		},
	],
};

export default config;
