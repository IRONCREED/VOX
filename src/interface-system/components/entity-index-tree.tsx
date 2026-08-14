'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type {
	InterfaceCopy,
	PublicEntityIndexEntry,
	PublicEntityKind,
} from '../../content-catalog/domain/content-model';

interface EntityIndexTreeProps {
	copy: InterfaceCopy;
	entries: PublicEntityIndexEntry[];
}

const ENTITY_KINDS: PublicEntityKind[] = [
	'series',
	'page',
	'material',
	'question',
	'concept',
	'claim',
	'source',
	'protocol',
	'asset',
];

function normalizeSearch(value: string) {
	return value.normalize('NFKC').toLocaleLowerCase().trim();
}

export function EntityIndexTree({ copy, entries }: EntityIndexTreeProps) {
	const [kind, setKind] = useState<'all' | PublicEntityKind>('all');
	const [query, setQuery] = useState('');
	const groups = useMemo(() => {
		const normalizedQuery = normalizeSearch(query);
		return ENTITY_KINDS.map((entityKind) => ({
			kind: entityKind,
			entries: entries.filter(
				(entry) =>
					(kind === 'all' || entry.kind === kind) &&
					entry.kind === entityKind &&
					(!normalizedQuery ||
						normalizeSearch(`${entry.label} ${entry.summary} ${entry.id}`).includes(
							normalizedQuery,
						)),
			),
		})).filter((group) => group.entries.length > 0);
	}, [entries, kind, query]);

	const visibleCount = groups.reduce((total, group) => total + group.entries.length, 0);

	return (
		<section aria-labelledby="corpus-index-title" className="entity-index">
			<header>
				<div>
					<h2 id="corpus-index-title">{copy.corpusIndex}</h2>
					<p>{copy.corpusIndexDescription}</p>
				</div>
				<small>{String(visibleCount).padStart(3, '0')}</small>
			</header>

			<label className="entity-index__field">
				<span>{copy.entityKind}</span>
				<select
					aria-label={copy.entityKind}
					onChange={(event) => setKind(event.target.value as 'all' | PublicEntityKind)}
					value={kind}
				>
					<option value="all">{copy.allEntityKinds}</option>
					{ENTITY_KINDS.map((entityKind) => (
						<option key={entityKind} value={entityKind}>
							{copy.entityKinds[entityKind]}
						</option>
					))}
				</select>
			</label>

			<label className="entity-index__field">
				<span>{copy.searchEntities}</span>
				<input
					onChange={(event) => setQuery(event.target.value)}
					placeholder={copy.searchEntities}
					type="search"
					value={query}
				/>
			</label>

			{groups.length > 0 ? (
				<div className="entity-index__tree">
					{groups.map((group) => (
						<details key={group.kind} open={kind !== 'all'}>
							<summary>
								<span>{copy.entityKinds[group.kind]}</span>
								<small>{String(group.entries.length).padStart(2, '0')}</small>
							</summary>
							<ul>
								{group.entries.map((entry) => (
									<li key={entry.id}>
										<details>
											<summary>{entry.label}</summary>
											<div>
												<code>{entry.id}</code>
												<p>{entry.summary}</p>
												{entry.href ? <Link href={entry.href}>{copy.openEntity}</Link> : null}
											</div>
										</details>
									</li>
								))}
							</ul>
						</details>
					))}
				</div>
			) : (
				<p className="entity-index__empty">{copy.noEntities}</p>
			)}
		</section>
	);
}
