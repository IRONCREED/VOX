import type { AboutStoryEntry } from './content-model';

export type PracticeProjectIdentity = Pick<
	AboutStoryEntry,
	| 'id'
	| 'clientId'
	| 'countryCodes'
	| 'workTypes'
	| 'primaryWorkType'
	| 'parentId'
	| 'originKind'
	| 'presentation'
>;

export function sortPracticeProjects<T extends PracticeProjectIdentity & { title: string }>(
	projects: T[],
	workTypes: { code: string }[],
	locale: string,
): T[] {
	const ranks = new Map(workTypes.map((type, index) => [type.code, index]));
	const rank = (project: T) =>
		ranks.get(project.primaryWorkType ?? project.workTypes?.[0] ?? '') ?? Number.MAX_SAFE_INTEGER;
	const collator = new Intl.Collator(locale, { sensitivity: 'base', numeric: true });
	return projects.toSorted((a, b) => rank(a) - rank(b) || collator.compare(a.title, b.title));
}

export function projectCountries(
	project: PracticeProjectIdentity,
	projects: PracticeProjectIdentity[],
): string[] {
	if (project.countryCodes?.length) return project.countryCodes;
	const parent = projects.find((item) => item.id === project.parentId);
	return parent ? projectCountries(parent, projects) : [];
}

export function selectPracticeProjects(
	projects: PracticeProjectIdentity[],
	country: string,
	workType: string,
) {
	const matched = projects.filter(
		(project) =>
			(country === 'all' || projectCountries(project, projects).includes(country)) &&
			(workType === 'all' || project.workTypes?.includes(workType)),
	);
	const visibleIds = new Set(matched.map((project) => project.id));
	for (const project of matched) {
		let parentId = project.parentId;
		while (parentId && !visibleIds.has(parentId)) {
			visibleIds.add(parentId);
			parentId = projects.find((item) => item.id === parentId)?.parentId;
		}
	}
	return {
		visibleIds,
		projectCount: matched.length,
		clientCount: new Set(matched.flatMap((project) => (project.clientId ? [project.clientId] : [])))
			.size,
	};
}

export function practiceCountryMarker(
	projects: PracticeProjectIdentity[],
	country: string,
): 'studio' | 'practice' {
	const associated = projects.filter((project) =>
		projectCountries(project, projects).includes(country),
	);
	return associated.length > 0 &&
		associated.every((project) => project.presentation === 'studio-reference')
		? 'studio'
		: 'practice';
}
