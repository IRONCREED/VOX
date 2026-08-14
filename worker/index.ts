/** Cloudflare Worker entry point for the IRON CREED site. */
import {
	DEFAULT_DEVICE_SIZES,
	DEFAULT_IMAGE_SIZES,
	handleImageOptimization,
} from 'vinext/server/image-optimization';
import handler from 'vinext/server/app-router-entry';
import { SUPPORTED_LOCALES } from '../src/content-catalog/domain/content-model';

interface Env {
	ASSETS: {
		fetch(request: Request): Promise<Response>;
	};
	IMAGES: {
		input(stream: ReadableStream): {
			transform(options: Record<string, unknown>): {
				output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
			};
		};
	};
}

interface ExecutionContext {
	waitUntil(promise: Promise<unknown>): void;
	passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === '/') {
			return Response.redirect(new URL('/uk/', url), 308);
		}

		if (url.pathname === '/ua' || url.pathname.startsWith('/ua/')) {
			const ukrainianPath = url.pathname.replace(/^\/ua(?=\/|$)/, '/uk');
			return Response.redirect(new URL(`${ukrainianPath}${url.search}`, url), 308);
		}

		if (url.pathname === '/_vinext/image') {
			const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
			return handleImageOptimization(
				request,
				{
					fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
					transformImage: async (body, { width, format, quality }) => {
						const result = await env.IMAGES.input(body)
							.transform(width > 0 ? { width } : {})
							.output({ format, quality });
						return result.response();
					},
				},
				allowedWidths,
			);
		}

		// Vinext normally removes trailing slashes globally. The constitutional
		// route contract deliberately keeps them only on locale landing pages,
		// while article and category URLs remain extensionless. Resolve the
		// landing page internally so its public canonical URL returns 200.
		const isLocaleLanding = SUPPORTED_LOCALES.some((locale) => url.pathname === `/${locale}/`);
		if (isLocaleLanding && (request.method === 'GET' || request.method === 'HEAD')) {
			const internalUrl = new URL(url);
			internalUrl.pathname = internalUrl.pathname.slice(0, -1);
			return handler.fetch(new Request(internalUrl, request), env, ctx);
		}

		return handler.fetch(request, env, ctx);
	},
};

export default worker;
