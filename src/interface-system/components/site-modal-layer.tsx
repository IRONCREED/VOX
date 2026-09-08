'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import type { InterfaceCopy, Locale } from '../../content-catalog/domain/content-model';
import { ModalDialog } from './modal-dialog';
import { SocialLinks } from './social-links';

const WELCOME_STORAGE_KEY = 'ironcreed:welcome-seen:v1';
const LOADER_COMPLETE_EVENT = 'ironcreed:loading-gate-complete';

interface WelcomeContent {
	description: ReactNode;
	href: string;
}

export interface ContentNotice {
	leaveHref: string;
	materialId: string;
	notice: string;
	rating: string;
}

interface SiteModalLayerProps {
	contentNotice?: ContentNotice;
	copy: InterfaceCopy;
	locale: Locale;
	welcome: WelcomeContent;
}

type ActiveModal = 'content' | 'welcome' | null;

function noticeStorageKey(notice: ContentNotice): string {
	return `ironcreed:content-notice:${notice.materialId}:${notice.rating}`;
}

function isStored(key: string): boolean {
	try {
		return window.localStorage.getItem(key) === 'true';
	} catch {
		return false;
	}
}

function store(key: string): void {
	try {
		window.localStorage.setItem(key, 'true');
	} catch {
		// A blocked storage API must not prevent access to public content.
	}
}

export function SiteModalLayer({ contentNotice, copy, locale, welcome }: SiteModalLayerProps) {
	const [activeModal, setActiveModal] = useState<ActiveModal>(null);

	useEffect(() => {
		function chooseInitialModal() {
			if (!isStored(WELCOME_STORAGE_KEY)) {
				setActiveModal('welcome');
				return;
			}

			if (contentNotice && !isStored(noticeStorageKey(contentNotice))) {
				setActiveModal('content');
			}
		}

		if (!document.querySelector('.loading-gate')) {
			const frame = window.requestAnimationFrame(chooseInitialModal);
			return () => window.cancelAnimationFrame(frame);
		}

		window.addEventListener(LOADER_COMPLETE_EVENT, chooseInitialModal, { once: true });
		return () => window.removeEventListener(LOADER_COMPLETE_EVENT, chooseInitialModal);
	}, [contentNotice]);

	function finishWelcome() {
		store(WELCOME_STORAGE_KEY);
		if (contentNotice && !isStored(noticeStorageKey(contentNotice))) {
			setActiveModal('content');
			return;
		}
		setActiveModal(null);
	}

	function acceptContentNotice() {
		if (contentNotice) store(noticeStorageKey(contentNotice));
		setActiveModal(null);
	}

	return (
		<>
			<ModalDialog
				actions={
					<>
						<Link href={welcome.href} onClick={() => store(WELCOME_STORAGE_KEY)}>
							{copy.welcomeAbout}
						</Link>
						<button onClick={finishWelcome} type="button">
							{copy.welcomeContinue}
						</button>
					</>
				}
				eyebrow="IRON CREED / SYSTEM ENTRY"
				initialFocus="title"
				onCancel={finishWelcome}
				open={activeModal === 'welcome'}
				title={copy.welcomeTitle}
			>
				<p>{welcome.description}</p>
				<SocialLinks label={copy.socialNetworks} locale={locale} variant="modal" />
			</ModalDialog>

			{contentNotice ? (
				<ModalDialog
					actions={
						<>
							<Link href={contentNotice.leaveHref}>{copy.contentNoticeLeave}</Link>
							<button onClick={acceptContentNotice} type="button">
								{copy.contentNoticeContinue}
							</button>
						</>
					}
					eyebrow={`${copy.ageRating} / ${contentNotice.rating}`}
					open={activeModal === 'content'}
					title={copy.contentNoticeTitle}
				>
					<p>{contentNotice.notice}</p>
				</ModalDialog>
			) : null}
		</>
	);
}
