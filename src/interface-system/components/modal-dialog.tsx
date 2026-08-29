'use client';

import type { ReactNode } from 'react';
import { useEffect, useId, useRef } from 'react';

interface ModalDialogProps {
	actions: ReactNode;
	children: ReactNode;
	eyebrow: string;
	onCancel?: () => void;
	open: boolean;
	title: string;
}

export function ModalDialog({
	actions,
	children,
	eyebrow,
	onCancel,
	open,
	title,
}: ModalDialogProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const titleId = useId();

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;

		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	}, [open]);

	return (
		<dialog
			aria-labelledby={titleId}
			className="site-modal"
			onCancel={(event) => {
				event.preventDefault();
				onCancel?.();
			}}
			ref={dialogRef}
		>
			<div className="site-modal__signal" />
			<header>
				<small>{eyebrow}</small>
				<h2 id={titleId}>{title}</h2>
			</header>
			<div className="site-modal__body">{children}</div>
			<footer>{actions}</footer>
		</dialog>
	);
}
