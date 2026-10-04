import type { AboutStoryEntry } from './content-model';

export type PracticeProjectIdentity = Pick<
	AboutStoryEntry,
	'id' | 'clientId' | 'countryCodes' | 'workTypes' | 'parentId' | 'originKind'
>;

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
