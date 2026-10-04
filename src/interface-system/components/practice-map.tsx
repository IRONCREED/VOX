'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { PracticeCountry, PracticeMapCopy } from '../../content-catalog/domain/content-model';
import {
	selectPracticeProjects,
	type PracticeProjectIdentity,
} from '../../content-catalog/domain/practice-portfolio';
import world from '../geography/world-countries.json';

const subscribe = () => () => {};
interface PracticeProject extends PracticeProjectIdentity {
	title: string;
	reviewCount: number;
	relations: { type: string; targetId: string; label: string; title: string }[];
	content: ReactNode;
}

export function PracticeMap({
	countries,
	workTypes,
	labels,
	projects,
	reviewNote,
}: {
	countries: PracticeCountry[];
	workTypes: { code: string; label: string }[];
	labels: PracticeMapCopy;
	projects: PracticeProject[];
	reviewNote: ReactNode;
}) {
	const enhanced = useSyncExternalStore(
		subscribe,
		() => true,
		() => false,
	);
	const [selected, setSelected] = useState('all');
	const [workType, setWorkType] = useState('all');
	const [typesOpen, setTypesOpen] = useState(false);
	const [scrollRequest, setScrollRequest] = useState(0);
	const [revealId, setRevealId] = useState<string>();
	const resultsRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (scrollRequest === 0) return;
		const target = revealId
			? document.getElementById(`practice-project-${revealId}`)
			: resultsRef.current;
		if (revealId) {
			let node = target;
			while (node) {
				if (node instanceof HTMLDetailsElement) node.open = true;
				node = node.parentElement;
			}
		}
		const focusTarget = revealId ? target?.querySelector('summary') : target;
		(focusTarget as HTMLElement | null)?.focus({ preventScroll: true });
		target?.scrollIntoView({
			block: 'start',
			behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
				? 'instant'
				: 'smooth',
		});
	}, [scrollRequest, revealId]);
	function apply(country: string, type: string) {
		setSelected(country);
		setWorkType(type);
		setRevealId(undefined);
		setScrollRequest((request) => request + 1);
	}
	const selection = selectPracticeProjects(projects, selected, workType);
	const active = countries.find((country) => country.code === selected);
	const markers = countries.flatMap((country) => {
		const point = world.countries.find((item) => item.id === country.geographyId)?.point;
		if (!point) return [];
		return [
			{
				country,
				point,
				x: point[0] + (country.labelOffset?.[0] ?? 0),
				y: point[1] + (country.labelOffset?.[1] ?? 0),
				count: new Set(
					projects.filter((p) => p.countryCodes?.includes(country.code)).map((p) => p.clientId),
				).size,
			},
		];
	});
	function renderProject(project: PracticeProject): ReactNode {
		const children = projects.filter((item) => item.parentId === project.id);
		return (
			<li key={project.id} hidden={enhanced && !selection.visibleIds.has(project.id)}>
				<details className="practice-project" id={`practice-project-${project.id}`}>
					<summary>
						<span>
							{project.title}
							{project.reviewCount ? (
								<small className="practice-project__review-count">
									{labels.reviews}: {project.reviewCount}
								</small>
							) : null}
						</span>
						<span aria-hidden="true">+</span>
					</summary>
					<div className="practice-project__content">
						{project.content}
						{children.length ? (
							<section aria-label={labels.components}>
								<p className="practice-project__meta">{labels.components}</p>
								<ul className="practice-project__tree">{children.map(renderProject)}</ul>
							</section>
						) : null}
						{project.relations.length ? (
							<section aria-label={labels.relations}>
								<p className="practice-project__meta">{labels.relations}</p>
								<ul className="practice-project__relations">
									{project.relations.map((relation) => (
										<li key={`${relation.type}:${relation.targetId}`}>
											<span>{relation.label} → </span>
											<a
												href={`#practice-project-${relation.targetId}`}
												onClick={
													enhanced
														? (event) => {
																event.preventDefault();
																setSelected('all');
																setWorkType('all');
																setRevealId(relation.targetId);
																setScrollRequest((n) => n + 1);
															}
														: undefined
												}
											>
												{relation.title}
											</a>
										</li>
									))}
								</ul>
							</section>
						) : null}
					</div>
				</details>
			</li>
		);
	}
	return (
		<div className="practice-map" data-enhanced={enhanced}>
			<div className="practice-map__canvas">
				<svg viewBox={`0 0 ${world.width} ${world.height}`} role="img" aria-label={labels.mapTitle}>
					{world.countries.map((country) => (
						<path
							key={country.id}
							d={country.path ?? ''}
							className="practice-map__country"
							data-client={countries.some((item) => item.geographyId === country.id)}
							data-selected={enhanced && active?.geographyId === country.id}
						/>
					))}
					{markers.map(({ country, point, x, y }) => (
						<line
							key={country.code}
							x1={point[0]}
							y1={point[1]}
							x2={x}
							y2={y}
							className="practice-map__leader"
						/>
					))}
				</svg>
				{markers.map(({ country, x, y, count }) => {
					const label = `${country.label} · ${labels.clients}: ${count}`;
					const style = { left: `${x / 10}%`, top: `${y / 5}%` };
					return enhanced ? (
						<button
							key={country.code}
							type="button"
							className="practice-map__marker"
							style={style}
							aria-label={label}
							title={label}
							aria-pressed={selected === country.code}
							aria-controls="practice-results"
							onClick={() => apply(country.code, workType)}
						>
							<span>{country.code}</span>
							<strong>{count}</strong>
						</button>
					) : (
						<a
							key={country.code}
							className="practice-map__marker"
							href="#practice-results"
							style={style}
							aria-label={label}
						>
							<span>{country.code}</span>
							<strong>{count}</strong>
						</a>
					);
				})}
			</div>
			<p className="practice-map__caption">{labels.geographyNote}</p>
			{enhanced ? (
				<div className="practice-map__controls">
					<div className="practice-map__filters">
						<button
							type="button"
							aria-expanded={typesOpen}
							aria-controls="practice-types"
							onClick={() => setTypesOpen((open) => !open)}
						>
							{labels.projectTypes} ·{' '}
							{workTypes.find((type) => type.code === workType)?.label ?? labels.allTypes}
						</button>
						{selected !== 'all' ? (
							<button type="button" onClick={() => apply('all', workType)}>
								{active?.label} × <span className="screen-reader-only">{labels.resetCountry}</span>
							</button>
						) : null}
					</div>
					<div
						id="practice-types"
						className="practice-map__filters"
						role="group"
						aria-label={labels.projectTypes}
						hidden={!typesOpen}
					>
						{[{ code: 'all', label: labels.allTypes }, ...workTypes].map((type) => (
							<button
								key={type.code}
								type="button"
								aria-pressed={workType === type.code}
								aria-controls="practice-results"
								onClick={() => apply(selected, type.code)}
							>
								{type.label}
							</button>
						))}
					</div>
				</div>
			) : null}
			<div id="practice-results" className="practice-map__results" ref={resultsRef} tabIndex={-1}>
				<p className="practice-map__selection" role="status">
					<strong>{active?.label ?? labels.allCountries}</strong>
					<span>
						{labels.clients}: {selection.clientCount} · {labels.projects}: {selection.projectCount}
					</span>
				</p>
				{selection.projectCount === 0 ? <p>{labels.empty}</p> : null}
				{(['external-relationship', 'owned'] as const).map((kind) => {
					const roots = projects.filter((p) => p.originKind === kind && !p.parentId);
					return (
						<section
							key={kind}
							hidden={enhanced && !roots.some((p) => selection.visibleIds.has(p.id))}
						>
							<h3>{kind === 'owned' ? labels.ownedWork : labels.clientWork}</h3>
							<ul className="practice-project__list">{roots.map(renderProject)}</ul>
						</section>
					);
				})}
			</div>
			<div className="practice-map__caption">{reviewNote}</div>
		</div>
	);
}
