import { NextResponse } from 'next/server';
import {
	isCategoryId,
	isTagId,
	paginateArticles,
} from '../../../src/content-catalog/adapters/corpus-content-repository';
import { isLocale } from '../../../src/content-catalog/domain/content-model';

export async function GET(request: Request) {
	const url = new URL(request.url);
	const locale = url.searchParams.get('locale') ?? '';
	const category = url.searchParams.get('category') || undefined;
	const tagId = url.searchParams.get('tag') || undefined;
	const page = Number(url.searchParams.get('page'));

	if (!isLocale(locale)) {
		return NextResponse.json({ error: 'Unsupported locale.' }, { status: 400 });
	}
	if (category && !isCategoryId(category)) {
		return NextResponse.json({ error: 'Unsupported category.' }, { status: 400 });
	}
	if (tagId && !isTagId(tagId)) {
		return NextResponse.json({ error: 'Unsupported tag.' }, { status: 400 });
	}

	return NextResponse.json(paginateArticles(locale, { categoryId: category, tagId }, page), {
		headers: {
			'cache-control': 'public, max-age=60, stale-while-revalidate=300',
		},
	});
}
