import type { ReactNode } from 'react';
import type { LocalizedDiagramAsset } from '../../diagram-system/domain/diagram-model';
import { DiagramAssetSlot } from '../../diagram-system/components/diagram-asset-slot';

interface ArticleBodyProps {
	body: string;
	variant?: 'standard' | 'scenario-log';
	assets?: LocalizedDiagramAsset[];
}

type MarkdownBlock =
	| {
			kind: 'heading';
			level: 1 | 2 | 3 | 4 | 5 | 6;
			content: string;
	  }
	| {
			kind: 'code';
			content: string;
			language?: string;
	  }
	| {
			kind: 'paragraph' | 'blockquote';
			content: string;
	  }
	| {
			kind: 'list';
			ordered: boolean;
			items: string[];
	  }
	| {
			kind: 'table';
			headers: string[];
			rows: string[][];
	  };

function parseTableRow(line: string): string[] {
	return line
		.trim()
		.replace(/^\|/, '')
		.replace(/\|$/, '')
		.split('|')
		.map((cell) => cell.trim());
}

function isTableSeparator(line: string | undefined): boolean {
	if (!line || !/^\s*\|.*\|\s*$/.test(line)) return false;
	const cells = parseTableRow(line);
	return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseBlocks(source: string): MarkdownBlock[] {
	const blocks: MarkdownBlock[] = [];
	const lines = source.split(/\r?\n/);
	let paragraph = '';
	let quotation: string[] = [];
	let list: string[] = [];
	let orderedList = false;
	let code: string[] = [];
	let codeLanguage: string | undefined;
	let inCodeBlock = false;

	function flushParagraph() {
		const content = paragraph.trim();
		if (content) {
			blocks.push({ kind: 'paragraph', content });
		}
		paragraph = '';
	}

	function flushQuotation() {
		if (quotation.length > 0) {
			blocks.push({
				kind: 'blockquote',
				content: quotation.join(' '),
			});
		}
		quotation = [];
	}

	function flushList() {
		if (list.length > 0) {
			blocks.push({
				kind: 'list',
				ordered: orderedList,
				items: list,
			});
		}
		list = [];
	}

	function flushAll() {
		flushParagraph();
		flushQuotation();
		flushList();
	}

	for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
		const line = lines[lineIndex];
		const codeFence = /^\`\`\`([a-z0-9+#.-]*)\s*$/i.exec(line);

		if (codeFence) {
			if (inCodeBlock) {
				blocks.push({
					kind: 'code',
					content: code.join('\n'),
					language: codeLanguage,
				});
				code = [];
				codeLanguage = undefined;
				inCodeBlock = false;
			} else {
				flushAll();
				codeLanguage = codeFence[1] || undefined;
				inCodeBlock = true;
			}
			continue;
		}

		if (inCodeBlock) {
			code.push(line);
			continue;
		}

		if (/^\s*\|.*\|\s*$/.test(line) && isTableSeparator(lines[lineIndex + 1])) {
			flushAll();
			const headers = parseTableRow(line);
			const rows: string[][] = [];
			let cursor = lineIndex + 2;
			while (cursor < lines.length && /^\s*\|.*\|\s*$/.test(lines[cursor])) {
				rows.push(parseTableRow(lines[cursor]));
				cursor += 1;
			}
			blocks.push({ kind: 'table', headers, rows });
			lineIndex = cursor - 1;
			continue;
		}

		const heading = /^(#{1,6})\s+(.+)$/.exec(line);
		const unorderedItem = /^-\s+(.+)$/.exec(line);
		const orderedItem = /^\d+\.\s+(.+)$/.exec(line);
		const quotedLine = /^>\s?(.*)$/.exec(line);

		if (heading) {
			flushAll();
			blocks.push({
				kind: 'heading',
				level: heading[1].length as 1 | 2 | 3 | 4 | 5 | 6,
				content: heading[2],
			});
			continue;
		}

		if (quotedLine) {
			flushParagraph();
			flushList();
			quotation.push(quotedLine[1]);
			continue;
		}

		if (unorderedItem || orderedItem) {
			flushParagraph();
			flushQuotation();
			const nextOrdered = Boolean(orderedItem);
			if (list.length > 0 && orderedList !== nextOrdered) {
				flushList();
			}
			orderedList = nextOrdered;
			list.push((orderedItem ?? unorderedItem)?.[1] ?? '');
			continue;
		}

		if (line.trim().length === 0) {
			flushAll();
			continue;
		}

		flushQuotation();
		flushList();
		const hardBreak = /\s{2}$/.test(line);
		paragraph += line.trim() + (hardBreak ? '\n' : ' ');
	}

	flushAll();
	if (inCodeBlock) {
		blocks.push({
			kind: 'code',
			content: code.join('\n'),
			language: codeLanguage,
		});
	}
	return blocks;
}

function safeHref(candidate: string) {
	if (candidate.startsWith('/')) {
		return candidate;
	}

	try {
		const url = new URL(candidate);
		return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
	} catch {
		return null;
	}
}

function renderInline(source: string, keyPrefix = 'inline'): ReactNode[] {
	const tokenPattern =
		/(\[[^\]]+\]\((?:https?:\/\/|\/)[^)]+\)|\*\*[^*]+\*\*|\*[^*\n]+\*|_[^_\n]+_|\x60[^\x60]+\x60|\n)/g;

	return source.split(tokenPattern).map((token, index) => {
		const key = keyPrefix + '-' + index;
		const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);

		if (link) {
			const href = safeHref(link[2]);
			if (!href) {
				return link[1];
			}

			const external = /^https?:\/\//.test(href);
			return (
				<a
					href={href}
					key={key}
					rel={external ? 'noreferrer noopener' : undefined}
					target={external ? '_blank' : undefined}
				>
					{renderInline(link[1], key)}
				</a>
			);
		}

		if (token.startsWith('**') && token.endsWith('**')) {
			return <strong key={key}>{token.slice(2, -2)}</strong>;
		}

		if (token.startsWith('*') && token.endsWith('*')) {
			return <em key={key}>{token.slice(1, -1)}</em>;
		}

		if (token.startsWith('_') && token.endsWith('_')) {
			return <em key={key}>{token.slice(1, -1)}</em>;
		}

		if (token.charCodeAt(0) === 96 && token.charCodeAt(token.length - 1) === 96) {
			return <code key={key}>{token.slice(1, -1)}</code>;
		}

		if (token === '\n') {
			return <br key={key} />;
		}

		return token;
	});
}

export function InlineMarkdown({ source }: { source: string }) {
	return <>{renderInline(source)}</>;
}

function graphicSlotId(content: string): string | undefined {
	return /^(?:[_*]{1,2})?(?:Графічний слот|Graphic slot|Visual slot|Схема|Diagram|Figure)\s+(G\d{2})\b/i
		.exec(content)?.[1]
		?.toUpperCase();
}

export function ArticleBody({ body, variant = 'standard', assets = [] }: ArticleBodyProps) {
	const blocks = parseBlocks(body);
	// The page template owns h1; a Markdown document title starts its body at h2.
	const headingOffset = blocks.some((block) => block.kind === 'heading' && block.level === 1)
		? 1
		: 0;

	return (
		<div
			className={
				variant === 'scenario-log' ? 'article-body article-body--scenario-log' : 'article-body'
			}
		>
			{blocks.map((block, index) => {
				if (block.kind === 'heading') {
					const Heading = `h${Math.min(6, Math.max(2, block.level + headingOffset))}` as
						| 'h2'
						| 'h3'
						| 'h4'
						| 'h5'
						| 'h6';
					return <Heading key={block.content + '-' + index}>{renderInline(block.content)}</Heading>;
				}

				if (block.kind === 'list') {
					const List = block.ordered ? 'ol' : 'ul';
					return (
						<List key={'list-' + index}>
							{block.items.map((item, itemIndex) => (
								<li key={item + '-' + itemIndex}>
									{renderInline(item, 'list-' + index + '-' + itemIndex)}
								</li>
							))}
						</List>
					);
				}

				if (block.kind === 'code') {
					return (
						<pre data-language={block.language} key={'code-' + index}>
							<code>{block.content}</code>
						</pre>
					);
				}

				if (block.kind === 'table') {
					return (
						<div className="article-table" key={'table-' + index}>
							<table>
								<thead>
									<tr>
										{block.headers.map((header, headerIndex) => (
											<th key={`${header}-${headerIndex}`} scope="col">
												{renderInline(header, `table-${index}-head-${headerIndex}`)}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{block.rows.map((row, rowIndex) => (
										<tr key={`row-${rowIndex}`}>
											{row.map((cell, cellIndex) => (
												<td key={`${cell}-${cellIndex}`}>
													{renderInline(cell, `table-${index}-${rowIndex}-${cellIndex}`)}
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					);
				}

				if (block.kind === 'blockquote') {
					const slotId = graphicSlotId(block.content);
					if (slotId) {
						const suffix = `.${slotId.toLowerCase()}`;
						const asset = assets.find((candidate) => candidate.id.endsWith(suffix));
						return (
							<DiagramAssetSlot
								asset={asset}
								brief={renderInline(block.content, 'diagram-brief-' + index)}
								key={'diagram-slot-' + index}
								slotId={slotId}
							/>
						);
					}
					return (
						<blockquote key={'blockquote-' + index}>
							{renderInline(block.content, 'blockquote-' + index)}
						</blockquote>
					);
				}

				const slotId = block.kind === 'paragraph' ? graphicSlotId(block.content) : undefined;
				if (slotId) {
					const suffix = `.${slotId.toLowerCase()}`;
					const asset = assets.find((candidate) => candidate.id.endsWith(suffix));
					return (
						<DiagramAssetSlot
							asset={asset}
							brief={renderInline(block.content, 'diagram-brief-' + index)}
							key={'diagram-slot-' + index}
							slotId={slotId}
						/>
					);
				}

				return (
					<p key={block.content + '-' + index}>
						{renderInline(block.content, 'paragraph-' + index)}
					</p>
				);
			})}
		</div>
	);
}
