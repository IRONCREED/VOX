import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { isLocale, SUPPORTED_LOCALES } from '../../src/content-catalog/domain/content-model';
import { BRAND_FAVICON_SRC } from '../../src/interface-system/components/brand-mark';
import { ThemeBootstrap } from '../../src/interface-system/components/theme-bootstrap';
import { getSiteOrigin } from '../../src/site-metadata/site-origin';
import '../globals.css';
import '../../src/interface-system/iron-creed-interface.css';

const geistSans = Geist({
	subsets: ['latin'],
	variable: '--font-geist-sans',
});

const geistMono = Geist_Mono({
	subsets: ['latin'],
	variable: '--font-geist-mono',
});

const siteDescription = 'Architecture, memory, and formal systems inside software.';
const socialPreview = new URL('/og.png', getSiteOrigin());

export const metadata: Metadata = {
	applicationName: 'IRON CREED',
	description: siteDescription,
	icons: {
		icon: BRAND_FAVICON_SRC,
		shortcut: BRAND_FAVICON_SRC,
		apple: BRAND_FAVICON_SRC,
	},
	manifest: '/manifest.webmanifest',
	metadataBase: getSiteOrigin(),
	openGraph: {
		description: siteDescription,
		images: [
			{
				alt: 'IRON CREED — architecture, memory, and formal systems',
				height: 630,
				url: socialPreview,
				width: 1200,
			},
		],
		siteName: 'IRON CREED',
		title: 'IRON CREED',
		type: 'website',
	},
	other: {
		'codex-preview': 'development',
	},
	robots: {
		follow: false,
		index: false,
	},
	twitter: {
		card: 'summary_large_image',
		description: siteDescription,
		images: [socialPreview],
		title: 'IRON CREED',
	},
};

export const viewport: Viewport = {
	colorScheme: 'light dark',
	themeColor: '#fcfcfc',
	width: 'device-width',
	initialScale: 1,
	viewportFit: 'cover',
};

export function generateStaticParams() {
	return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
	children,
	params,
}: Readonly<{
	children: ReactNode;
	params: Promise<{ locale: string }>;
}>) {
	const { locale } = await params;

	if (!isLocale(locale)) {
		notFound();
	}

	return (
		<html lang={locale} suppressHydrationWarning>
			<head>
				<ThemeBootstrap />
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable}`}>
				<noscript>
					<style>{'.loading-gate{display:none!important}'}</style>
				</noscript>
				{children}
			</body>
		</html>
	);
}
