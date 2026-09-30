'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { PracticeCountry, PracticeMapCopy } from '../../content-catalog/domain/content-model';
import world from '../geography/world-countries.json';

const subscribe = () => () => {};
interface PracticeGroup {
	code: string;
	clientCount: number;
	projectCount: number;
	content: ReactNode;
}

export function PracticeMap({
	countries,
	labels,
	groups,
	reviewNote,
}: {
	countries: PracticeCountry[];
	labels: PracticeMapCopy;
	groups: PracticeGroup[];
	reviewNote: ReactNode;
}) {
	const enhanced = useSyncExternalStore(
		subscribe,
		() => true,
		() => false,
	);
	const [selected, setSelected] = useState(countries[0].code);
	const [scrollRequest, setScrollRequest] = useState(0);
	const resultsRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (scrollRequest === 0) return;
		const results = resultsRef.current;
		results?.focus({ preventScroll: true });
		results?.scrollIntoView({
			block: 'start',
			behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
				? 'instant'
				: 'smooth',
		});
	}, [scrollRequest]);
	const active = countries.find((country) => country.code === selected);
	const visibleGroups = groups.filter((group) => selected === 'all' || group.code === selected);
	const selectedClients = visibleGroups.reduce((sum, group) => sum + group.clientCount, 0);
	const selectedProjects = visibleGroups.reduce((sum, group) => sum + group.projectCount, 0);
	const markers = countries.flatMap((country) => {
		if (!country.geographyId) return [];
		const point = world.countries.find((item) => item.id === country.geographyId)?.point;
		if (!point) return [];
		return [
			{
				country,
				point,
				x: point[0] + (country.labelOffset?.[0] ?? 0),
				y: point[1] + (country.labelOffset?.[1] ?? 0),
				count: groups.find((group) => group.code === country.code)?.clientCount ?? 0,
			},
		];
	});
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
							onClick={() => {
								setSelected(country.code);
								setScrollRequest((request) => request + 1);
							}}
						>
							<span>{country.code}</span>
							<strong>{count}</strong>
						</button>
					) : (
						<a
							key={country.code}
							className="practice-map__marker"
							href={`#practice-${country.code}`}
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
				<div className="practice-map__filters" role="group" aria-label={labels.mapTitle}>
					{[{ code: 'all', label: labels.allCountries }, ...countries].map((country) => (
						<button
							key={country.code}
							type="button"
							aria-pressed={selected === country.code}
							aria-controls="practice-results"
							onClick={() => setSelected(country.code)}
						>
							{country.label}
							{country.code !== 'all' ? (
								<span>{groups.find((group) => group.code === country.code)?.clientCount}</span>
							) : null}
						</button>
					))}
				</div>
			) : null}
			<div id="practice-results" className="practice-map__results" ref={resultsRef} tabIndex={-1}>
				{enhanced ? (
					<p className="practice-map__selection" role="status">
						<strong>{active?.label ?? labels.allCountries}</strong>
						<span>
							{labels.clients}: {selectedClients} · {labels.projects}: {selectedProjects}
						</span>
					</p>
				) : null}
				{groups.map((group) => (
					<section
						key={group.code}
						id={`practice-${group.code}`}
						aria-label={countries.find((country) => country.code === group.code)?.label}
						hidden={enhanced && selected !== 'all' && selected !== group.code}
					>
						{!enhanced || selected === 'all' ? (
							<h3>{countries.find((country) => country.code === group.code)?.label}</h3>
						) : null}
						{group.code === 'ZZ' ? (
							<p className="practice-map__caption">{labels.unlocatedNote}</p>
						) : null}
						{group.content}
					</section>
				))}
			</div>
			<div className="practice-map__caption">{reviewNote}</div>
		</div>
	);
}
