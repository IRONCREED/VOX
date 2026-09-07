import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompiledSiteDriver } from '../../testing-interface/site-driver.mjs';

const withoutReactMarkers = (html) => html.replaceAll('<!-- -->', '');

test('section artwork and raster favicons resolve from the deployed site origin', async () => {
	const site = await createCompiledSiteDriver();
	for (const locale of ['uk', 'en']) {
		const home = await (await site.request(`/${locale}/`)).text();
		for (const icon of ['tent', 'observer', 'code', 'microscope', 'branches', 'book']) {
			assert.ok(home.includes(`src="/brand/navigation/${icon}-96.png"`));
		}
		assert.match(home, /section-icon--heading/);
		assert.match(home, /href="\/favicon-32\.png\?v=20260906"/);
		assert.match(home, /href="\/favicon\.ico\?v=20260906"/);
	}
	for (const asset of [
		'/favicon-32.png?v=20260906',
		'/favicon.ico?v=20260906',
		'/brand/navigation/tent-96.png',
	]) {
		const response = await site.request(asset);
		assert.equal(response.status, 200, asset);
		const bytes = new Uint8Array(await response.arrayBuffer());
		assert.ok(bytes.length > 100, asset);
		assert.deepEqual(
			[...bytes.slice(0, asset.includes('.ico') ? 4 : 8)],
			asset.includes('.ico') ? [0, 0, 1, 0] : [137, 80, 78, 71, 13, 10, 26, 10],
		);
	}
	for (const [route, phrase, retained] of [
		['/uk/scenarios/ne-biitesia-ser-shturm', 'Хороший пес', 'Силову установку пробило'],
		['/en/scenarios/do-not-be-afraid-sir-assault', 'Good dog', 'Its power plant was breached'],
	]) {
		const html = await (await site.request(route)).text();
		assert.ok(!html.includes(phrase));
		assert.ok(html.includes(retained));
	}
});

test('material API clamps an exhausted page to the addressable catalog', async () => {
	const site = await createCompiledSiteDriver();
	const response = await site.request('/api/materials?locale=uk&page=99');

	assert.equal(response.status, 200);
	const payload = await response.json();
	assert.equal(payload.page, 3);
	assert.equal(payload.pageSize, 2);
	assert.equal(payload.totalItems, 6);
	assert.equal(payload.totalPages, 3);
	assert.equal(payload.items.length, 2);
	assert.ok(payload.items.every((item) => item.href.startsWith('/uk/')));
});

test('the retired games category has no navigation, route, or API filter', async () => {
	const site = await createCompiledSiteDriver();
	const [ukHome, enHome, ukRoute, enRoute, api] = await Promise.all([
		site.request('/uk/'),
		site.request('/en/'),
		site.request('/uk/games'),
		site.request('/en/games'),
		site.request('/api/materials?locale=en&category=games&page=1'),
	]);

	assert.doesNotMatch(await ukHome.text(), /href=["']\/uk\/games["']/);
	assert.doesNotMatch(await enHome.text(), /href=["']\/en\/games["']/);
	assert.equal(ukRoute.status, 404);
	assert.equal(enRoute.status, 404);
	assert.equal(api.status, 400);
});

test('one stable tag filters both the server page and progressive endpoint', async () => {
	const site = await createCompiledSiteDriver();
	const [pageResponse, apiResponse, invalidResponse] = await Promise.all([
		site.request('/uk/research?tag=war'),
		site.request('/api/materials?locale=uk&category=research&tag=war&page=1'),
		site.request('/api/materials?locale=uk&tag=unknown-tag&page=1'),
	]);

	assert.equal(pageResponse.status, 200);
	const html = await pageResponse.text();
	assert.match(html, /aria-label="Відібрати за тегом"/);
	assert.match(html, /href="\/uk\/research\?tag=war"[^>]*aria-current="page"/);
	assert.match(html, /Від тіла до сигналу/);

	assert.equal(apiResponse.status, 200);
	const payload = await apiResponse.json();
	assert.equal(payload.totalItems, 1);
	assert.equal(payload.items.length, 1);
	assert.ok(payload.items[0].tags.includes('war'));

	assert.equal(invalidResponse.status, 400);
});

test('one material series replaces its seven parts in catalog listings', async () => {
	const site = await createCompiledSiteDriver();
	const [homeResponse, researchResponse, apiResponse, seriesResponse] = await Promise.all([
		site.request('/en/'),
		site.request('/en/research'),
		site.request('/api/materials?locale=en&category=research&page=1'),
		site.request('/en/series/the-constitution-that-runs'),
	]);

	for (const response of [homeResponse, researchResponse, apiResponse, seriesResponse]) {
		assert.equal(response.status, 200);
	}

	const homeHtml = await homeResponse.text();
	assert.match(homeHtml, /href="\/en\/series\/the-constitution-that-runs"/);
	const nextHomeResponse = await site.request('/en/?page=2');
	assert.equal(nextHomeResponse.status, 200);
	const nextHomeHtml = await nextHomeResponse.text();
	assert.match(homeHtml, /href="\/en\/series\/the-great-and-terrible-cloudflare"/);
	assert.match(nextHomeHtml, /href="\/en\/series\/psychobiosocial-patterns"/);
	assert.match(homeHtml, /material-card--series/);
	assert.match(homeHtml, /protocol-folder__back/);
	assert.match(homeHtml, /protocol-folder__sheet--1/);
	assert.match(homeHtml, /protocol-folder__sheet--2/);
	const plainHomeHtml = withoutReactMarkers(homeHtml);
	assert.match(plainHomeHtml, /Research · Material series · 7/);
	assert.match(withoutReactMarkers(nextHomeHtml), /Scenarios · Material series · 12/);
	assert.match(plainHomeHtml, /Programming · Material series · 1/);

	const researchHtml = await researchResponse.text();
	assert.match(researchHtml, /The “Regulated Availability” Pattern/);
	assert.equal((researchHtml.match(/data-catalog-id=/g) ?? []).length, 2);
	assert.equal(
		(researchHtml.match(/data-catalog-id="series\.psychobiosocial-patterns"/g) ?? []).length,
		1,
	);
	assert.equal(
		(researchHtml.match(/data-catalog-id="series\.constitution-runtime"/g) ?? []).length,
		1,
	);
	assert.doesNotMatch(
		researchHtml,
		/data-catalog-id="material\.constitution-runtime-01-article-vii"/,
	);

	const payload = await apiResponse.json();
	assert.equal(payload.totalItems, 3);
	assert.equal(payload.items.filter((item) => item.kind === 'series').length, 2);
	assert.equal(payload.items.find((item) => item.partCount === 7)?.kind, 'series');

	const seriesHtml = await seriesResponse.text();
	assert.match(seriesHtml, /The Constitution That Runs/);
	assert.match(seriesHtml, /Connect America: How Article VII Bootstraps a Republic/);
	assert.match(seriesHtml, /Write America: How Article I Turns Intent into General Law/);
	assert.equal(
		(seriesHtml.match(/data-catalog-id="material\.constitution-runtime-/g) ?? []).length,
		7,
	);
});

test('Ada is a twelve-part scenario series with one age contract per part', async () => {
	const site = await createCompiledSiteDriver();
	const [seriesResponse, firstResponse, finalResponse] = await Promise.all([
		site.request('/en/series/do-not-be-afraid-sir-adas-machine-requiem'),
		site.request('/en/scenarios/do-not-be-afraid-sir'),
		site.request('/en/scenarios/do-not-be-afraid-sir-death-of-my-world'),
	]);

	for (const response of [seriesResponse, firstResponse, finalResponse]) {
		assert.equal(response.status, 200);
	}

	const seriesHtml = withoutReactMarkers(await seriesResponse.text());
	assert.match(seriesHtml, /Do Not Be Afraid, Sir: Ada’s Machine Requiem/);
	assert.equal(
		(seriesHtml.match(/data-catalog-id="material\.ada-machine-requiem-/g) ?? []).length,
		11,
	);
	assert.match(seriesHtml, /data-catalog-id="material\.do-not-be-afraid-sir"/);

	const firstHtml = withoutReactMarkers(await firstResponse.text());
	assert.match(firstHtml, />1\/12</);
	assert.match(firstHtml, /Age rating/);
	assert.match(firstHtml, /Age rating \/ 21\+/);
	assert.match(firstHtml, /Content notice/);
	assert.match(firstHtml, /graphic descriptions of violence/);

	const finalHtml = withoutReactMarkers(await finalResponse.text());
	assert.match(finalHtml, />12\/12</);
	assert.match(finalHtml, /I will stay with you/);
	assert.doesNotMatch(finalHtml, /rel="next"/);
});

test('series parts expose membership, permanent DOI, authors, and previous-next navigation', async () => {
	const site = await createCompiledSiteDriver();
	const [firstResponse, middleResponse, lastResponse] = await Promise.all([
		site.request('/en/research/connect-america-how-article-vii-bootstraps-a-republic'),
		site.request('/en/research/update-america-how-article-v-changes-the-constitutional-kernel'),
		site.request('/en/research/write-america-how-article-i-turns-intent-into-general-law'),
	]);

	for (const response of [firstResponse, middleResponse, lastResponse]) {
		assert.equal(response.status, 200);
	}

	const firstHtml = withoutReactMarkers(await firstResponse.text());
	assert.match(firstHtml, /The Constitution That Runs/);
	assert.match(firstHtml, />1\/7</);
	assert.match(
		firstHtml,
		/href="\/en\/research\/what-america-trusts-how-article-vi-assembles-the-supreme-order"[^>]*rel="next"/,
	);
	assert.match(firstHtml, /href="https:\/\/doi\.org\/10\.5281\/zenodo\.21894242"/);
	assert.match(firstHtml, /href="https:\/\/orcid\.org\/0009-0009-2621-6372"/);
	assert.match(firstHtml, /href="https:\/\/orcid\.org\/0009-0003-8777-8412"/);

	const middleHtml = withoutReactMarkers(await middleResponse.text());
	assert.match(middleHtml, />3\/7</);
	assert.match(middleHtml, /rel="prev"/);
	assert.match(middleHtml, /rel="next"/);

	const lastHtml = withoutReactMarkers(await lastResponse.text());
	assert.match(lastHtml, />7\/7</);
	assert.match(lastHtml, /rel="prev"/);
	assert.doesNotMatch(lastHtml, /rel="next"/);
});

test('the programming post is addressable and filterable by its stable tag', async () => {
	const site = await createCompiledSiteDriver();
	const [categoryResponse, articleResponse, apiResponse] = await Promise.all([
		site.request('/en/programming?tag=documentation'),
		site.request('/en/programming/why-documentation-matters'),
		site.request('/api/materials?locale=en&category=programming&tag=documentation&page=1'),
	]);

	assert.equal(categoryResponse.status, 200);
	assert.match(await categoryResponse.text(), /Why Documentation Matters/);

	assert.equal(articleResponse.status, 200);
	const articleHtml = await articleResponse.text();
	assert.match(articleHtml, /How a Decision Outlives Its Author/);
	assert.match(articleHtml, /<pre[^>]*data-language="ts"[^>]*><code>/);
	assert.match(articleHtml, /10\.5281\/zenodo\.20608558/);

	assert.equal(apiResponse.status, 200);
	const payload = await apiResponse.json();
	assert.equal(payload.totalItems, 1);
	assert.equal(payload.items.length, 1);
	assert.ok(payload.items[0].tags.includes('documentation'));
});

test('the complete entity index has its own localized content page', async () => {
	const site = await createCompiledSiteDriver();
	const [ukHomeResponse, ukResponse, enResponse, deepQuestionResponse, indexQuestionResponse] =
		await Promise.all([
			site.request('/uk/'),
			site.request('/uk/pages/corpus-index'),
			site.request('/en/pages/corpus-index'),
			site.request('/en/research/from-body-to-signal?question=q.channel-centrality#companion'),
			site.request('/en/questions/q.ada.why-not-stop-sir'),
		]);
	assert.equal(ukHomeResponse.status, 200);
	const ukHomeHtml = await ukHomeResponse.text();
	assert.match(ukHomeHtml, /href="\/uk\/pages\/corpus-index"/);
	assert.doesNotMatch(ukHomeHtml, /aria-label="Тип сутності"/);
	assert.equal(ukResponse.status, 200);
	const ukHtml = await ukResponse.text();
	assert.match(ukHtml, /Індекс корпусу/);
	assert.match(ukHtml, /aria-label="Тип сутності"/);
	assert.match(ukHtml, /value="question"/);
	assert.match(ukHtml, />645<\/small>/);
	assert.match(ukHtml, /value="page"/);

	assert.equal(enResponse.status, 200);
	const enHtml = await enResponse.text();
	assert.match(enHtml, /Corpus index/);
	assert.match(enHtml, /All kinds/);
	assert.match(enHtml, /q\.documentation\.documentation-memory/);
	assert.match(enHtml, /page\.about/);
	assert.match(enHtml, /concept\.iron-creed/);
	assert.doesNotMatch(enHtml, /Ordinary mode/);
	assert.doesNotMatch(enHtml, /page-directory/);

	assert.equal(deepQuestionResponse.status, 200);
	assert.match(await deepQuestionResponse.text(), /AI companion/);
	assert.equal(indexQuestionResponse.status, 200);
	const questionHtml = await indexQuestionResponse.text();
	assert.match(questionHtml, /data-selected-entity="q\.ada\.why-not-stop-sir"/);
	assert.match(questionHtml, /data-selected="true"/);
	assert.match(questionHtml, /Materials under this question/);
	assert.match(questionHtml, /Do Not Be Afraid, Sir/);
	assert.match(questionHtml, /application\/ld\+json/);
});

test('the build, policies, and four localized search maps are public', async () => {
	const site = await createCompiledSiteDriver();
	const [
		home,
		about,
		licensing,
		privacy,
		robots,
		sitemap,
		ukSiteMap,
		ukQuestionMap,
		enSiteMap,
		enQuestionMap,
	] = await Promise.all([
		site.request('/en/'),
		site.request('/en/pages/about'),
		site.request('/en/pages/licensing'),
		site.request('/en/pages/privacy-policy'),
		site.request('/robots.txt'),
		site.request('/sitemap.xml'),
		site.request('/sitemaps/uk/site.xml'),
		site.request('/sitemaps/uk/questions.xml'),
		site.request('/sitemaps/en/site.xml'),
		site.request('/sitemaps/en/questions.xml'),
	]);

	assert.equal(home.status, 200);
	const homeHtml = await home.text();
	assert.match(homeHtml, /This system will live/);
	assert.match(homeHtml, /href="https:\/\/github\.com\/IRONCREED\/VOX"/);
	assert.match(homeHtml, /Lady Hague/);
	assert.doesNotMatch(homeHtml, /aria-label="Next line"/);
	assert.match(homeHtml, /href="\/en\/pages\/about"/);

	assert.equal(about.status, 200);
	const aboutHtml = await about.text();
	assert.match(aboutHtml, /identity and role in the game remain classified/);
	assert.match(aboutHtml, /personified engineering process/);
	assert.doesNotMatch(aboutHtml, /military medical-AI prototype/);
	assert.match(aboutHtml, /Who is IRON CREED\?/);
	assert.match(aboutHtml, /IRON CREED — the personified engineering process of Zhovten Games/);
	const cycleHtml = await (await site.request('/en/pages/material-cycle')).text();
	assert.match(cycleHtml, /From a working question to a verifiable publication/);
	assert.doesNotMatch(aboutHtml, /about-cycle__steps/);
	assert.match(aboutHtml, /DevOps as a way of working/);
	assert.match(aboutHtml, /A website that can be read by more than people/);
	assert.match(aboutHtml, /EMBO Studio · long-term infrastructure support/);
	assert.match(aboutHtml, /Shifton, Zipy, and 200\+ high-density cases/);
	assert.match(aboutHtml, /Public team profiles/);
	assert.match(aboutHtml, /href="https:\/\/www\.linkedin\.com\/in\/oksanadubinetska\/"/);
	assert.match(aboutHtml, /href="https:\/\/www\.linkedin\.com\/in\/pan-canon\/"/);
	assert.match(aboutHtml, /Sam Starling/);
	assert.match(aboutHtml, /href="https:\/\/www\.linkedin\.com\/company\/IRONCREED"/);
	assert.doesNotMatch(aboutHtml, /Project type|Problem description/);
	assert.match(aboutHtml, /I hired Semen for a project for my client/);
	assert.match(aboutHtml, /The work was done with an understanding of the matter/);
	assert.match(aboutHtml, /Thank you\. The work is done/);
	assert.doesNotMatch(aboutHtml, /Ruslan|Руслан|Pan Canon/);
	assert.match(aboutHtml, /original reviews on specific platforms are available on request/);
	assert.doesNotMatch(aboutHtml, /href="https:\/\/freelancehunt\.com/);
	assert.doesNotMatch(aboutHtml, /Testimonials will be published after client approval/);
	assert.match(
		aboutHtml,
		/href="https:\/\/github\.com\/IRONCREED\/VOX\/tree\/main\/constitutional-guard"/,
	);
	assert.match(aboutHtml, /OpenAI GPT/);
	assert.match(aboutHtml, /https:\/\/interdead\.phantom-draft\.com\//);
	assert.match(aboutHtml, /AI companion/);

	for (const response of [licensing, privacy]) assert.equal(response.status, 200);
	const licensingHtml = await licensing.text();
	for (const slug of ['terms-of-use', 'privacy-policy', 'ai-policy', 'licensing']) {
		assert.match(licensingHtml, new RegExp(`href="/en/pages/${slug}"`));
	}
	assert.match(licensingHtml, /<table>/);
	assert.match(licensingHtml, /CC BY-SA 4\.0/);
	assert.match(licensingHtml, /Every production deployment/);
	assert.match(licensingHtml, /VOX-PUBLICATION\.json/);

	assert.equal(robots.status, 200);
	const robotsText = await robots.text();
	assert.match(robotsText, /Allow:\s*\//i);
	assert.match(robotsText, /Sitemap:.*\/sitemap\.xml/i);
	assert.equal(sitemap.status, 200);
	const sitemapText = await sitemap.text();
	assert.equal((sitemapText.match(/<sitemap>/g) ?? []).length, 4);
	for (const response of [ukSiteMap, ukQuestionMap, enSiteMap, enQuestionMap]) {
		assert.equal(response.status, 200);
	}
	assert.equal(((await ukSiteMap.text()).match(/<url>/g) ?? []).length, 40);
	assert.equal(((await enSiteMap.text()).match(/<url>/g) ?? []).length, 40);
	const ukQuestions = await ukQuestionMap.text();
	const enQuestions = await enQuestionMap.text();
	assert.equal((ukQuestions.match(/<url>/g) ?? []).length, 476);
	assert.equal((enQuestions.match(/<url>/g) ?? []).length, 476);
	assert.match(enQuestions, /\/en\/questions\/q\.ada\.why-not-stop-sir/);
	assert.doesNotMatch(enQuestions, /\?question=/);
});

test('publication metadata uses permanent DOI and linked ORCID authors', async () => {
	const site = await createCompiledSiteDriver();
	const [research, programming] = await Promise.all([
		site.request('/en/research/from-body-to-signal'),
		site.request('/en/programming/why-documentation-matters'),
	]);
	const researchHtml = await research.text();
	const programmingHtml = await programming.text();

	assert.match(researchHtml, /href="https:\/\/doi\.org\/10\.5281\/zenodo\.19773963"/);
	assert.match(programmingHtml, /href="https:\/\/doi\.org\/10\.5281\/zenodo\.20608558"/);
	for (const html of [researchHtml, programmingHtml]) {
		assert.match(html, /href="https:\/\/orcid\.org\/0009-0009-2621-6372"/);
		assert.match(html, /href="https:\/\/orcid\.org\/0009-0003-8777-8412"/);
	}
	assert.match(
		researchHtml,
		/<em>Language as Infection: Media Communication as a Mechanism of Harm<\/em>/,
	);
});

test('the canonical monogram, welcome dialog, social links, and loader copy share one shell', async () => {
	const site = await createCompiledSiteDriver();
	const response = await site.request('/en/');
	assert.equal(response.status, 200);
	const html = await response.text();

	assert.match(html, /data-brand-state="ic-faceted-monogram-2026"/);
	assert.match(html, /src="\/brand\/iron-creed-mark\.svg"/);
	assert.match(html, /class="brand-mark brand-mark--header"/);
	assert.match(html, /class="brand-mark brand-mark--loader"/);
	assert.match(html, /class="brand-mark brand-mark--folder"/);
	assert.match(html, /I stand/);
	assert.match(html, /When everything/);
	assert.match(html, /Lies down\./);
	assert.match(html, /Welcome to IRON CREED/);
	assert.match(html, /IRON CREED is a currently classified recurring character/);
	assert.match(html, /href="https:\/\/t\.me\/\+6-ge0JXP25o4MTQy"/);
	assert.match(html, /href="https:\/\/github\.com\/IRONCREED"/);
	assert.match(html, /href="https:\/\/www\.linkedin\.com\/company\/IRONCREED"/);
	assert.match(html, /class="social-links social-links--sidebar"/);
	assert.match(html, /class="social-links social-links--modal"/);
});

test('the header exposes the persistent opt-in anthem player after the theme control', async () => {
	const site = await createCompiledSiteDriver();
	const [ukResponse, enResponse, privacyResponse] = await Promise.all([
		site.request('/uk/'),
		site.request('/en/'),
		site.request('/en/pages/privacy-policy'),
	]);
	for (const response of [ukResponse, enResponse, privacyResponse])
		assert.equal(response.status, 200);

	const ukHtml = withoutReactMarkers(await ukResponse.text());
	const enHtml = withoutReactMarkers(await enResponse.text());
	assert.match(
		ukHtml,
		/class="theme-switcher"[\s\S]*aria-label="Увімкнути гімн: IRON CREED"[^>]*class="anthem-toggle"/,
	);
	assert.match(enHtml, /aria-label="Play the anthem: IRON CREED"/);
	assert.match(enHtml, /<audio[^>]*aria-hidden="true"[^>]*preload="none"/);
	assert.match(enHtml, /src="\/audio\/iron-creed-anthem\.m4a"/);
	assert.doesNotMatch(enHtml, /cdn1\.suno\.ai/);
	assert.doesNotMatch(enHtml, /autoplay/);
	const privacyHtml = await privacyResponse.text();
	assert.match(privacyHtml, /same-origin site asset/i);
	assert.doesNotMatch(privacyHtml, /requests[\s\S]*directly from Suno/i);
});
