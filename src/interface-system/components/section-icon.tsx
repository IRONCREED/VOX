/* eslint-disable @next/next/no-img-element -- fixed-size local artwork is delivered directly without the image optimizer */

const SECTION_ICONS: Readonly<Record<string, string>> = {
	home: 'tent',
	about: 'observer',
	programming: 'code',
	research: 'microscope',
	scenarios: 'branches',
	courses: 'book',
};

export function SectionIcon({
	sectionId,
	variant = 'navigation',
}: {
	sectionId: string;
	variant?: 'navigation' | 'heading';
}) {
	const icon = SECTION_ICONS[sectionId];
	if (!icon) return null;
	return (
		<img
			alt=""
			aria-hidden="true"
			className={`section-icon section-icon--${variant}`}
			draggable="false"
			height={96}
			src={`/brand/navigation/${icon}-96.png`}
			srcSet={`/brand/navigation/${icon}-96.png 96w, /brand/navigation/${icon}-192.png 192w`}
			sizes={
				variant === 'heading' ? '(max-width: 960px) 48px, (max-width: 1520px) 5vw, 76px' : '31px'
			}
			width={96}
		/>
	);
}
