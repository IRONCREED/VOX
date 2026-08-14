'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import interfaceBehavior from '../../../content/config/interface-behavior.json';
import type {
	CompanionQuestion,
	CompanionScenario,
	InterfaceCopy,
	Locale,
} from '../../content-catalog/domain/content-model';
import {
	advanceTypewriterFrame,
	type TypewriterFrame,
	visibleLengthForRun,
} from '../behaviors/typewriter-run';
import { PulseLine } from './pulse-line';

function renderLinkedAnswer(text: string) {
	return text.split(/(https:\/\/[^\s]+)/g).map((part, index) => {
		if (!part.startsWith('https://')) return part;
		const match = /^(.*?)([.,;:!?)]*)$/.exec(part);
		const href = match?.[1] ?? part;
		const punctuation = match?.[2] ?? '';
		return (
			<span key={`${href}-${index}`}>
				<a href={href} rel="noreferrer noopener" target="_blank">
					{href}
				</a>
				{punctuation}
			</span>
		);
	});
}

interface CompanionPanelProps {
	copy: InterfaceCopy;
	locale: Locale;
	scenario: CompanionScenario;
}

type DialogueState = 'idle' | 'inviting' | 'ready' | 'answering';

function useReducedMotion() {
	const [reducedMotion, setReducedMotion] = useState(false);

	useEffect(() => {
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		const update = () => setReducedMotion(media.matches);
		const initialUpdate = window.setTimeout(update, 0);
		media.addEventListener('change', update);
		return () => {
			window.clearTimeout(initialUpdate);
			media.removeEventListener('change', update);
		};
	}, []);

	return reducedMotion;
}

function useTypedText(
	text: string,
	runId: string,
	active: boolean,
	reducedMotion: boolean,
	speed = 9,
) {
	const [frame, setFrame] = useState<TypewriterFrame>({
		runId: '',
		visibleLength: 0,
	});
	const visibleLength = visibleLengthForRun(frame, runId);

	useEffect(() => {
		if (!active) {
			return;
		}

		if (reducedMotion) {
			const timeout = window.setTimeout(() => setFrame({ runId, visibleLength: text.length }), 0);
			return () => window.clearTimeout(timeout);
		}

		if (visibleLength >= text.length) {
			return;
		}

		const timeout = window.setTimeout(() => {
			setFrame((current) => advanceTypewriterFrame(current, runId, text.length));
		}, speed);

		return () => window.clearTimeout(timeout);
	}, [active, reducedMotion, runId, speed, text, visibleLength]);

	return {
		text: text.slice(0, visibleLength),
		complete: active && visibleLength >= text.length,
	};
}

function resolvePath(
	questions: CompanionQuestion[],
	path: string[],
): { nodes: CompanionQuestion[]; selected: CompanionQuestion | null } {
	const byId = new Map(questions.map((question) => [question.id, question]));
	const nodes = path
		.map((id) => byId.get(id))
		.filter((node): node is CompanionQuestion => Boolean(node));
	if (nodes.length !== path.length) return { nodes: [], selected: null };

	return {
		nodes,
		selected: nodes.at(-1) ?? null,
	};
}

function findQuestionPath(scenario: CompanionScenario, targetId: string): string[] | null {
	const questionIds = new Set(scenario.questions.map((question) => question.id));
	if (!questionIds.has(targetId)) return null;
	const adjacency = new Map<string, string[]>();
	for (const edge of scenario.edges.toSorted((left, right) => left.order - right.order)) {
		const targets = adjacency.get(edge.from) ?? [];
		targets.push(edge.to);
		adjacency.set(edge.from, targets);
	}
	const queue = scenario.entryQuestionIds.map((id) => [id]);
	const visited = new Set<string>();
	while (queue.length > 0) {
		const path = queue.shift();
		if (!path) break;
		const activeId = path.at(-1);
		if (!activeId || visited.has(activeId)) continue;
		if (activeId === targetId) return path;
		visited.add(activeId);
		for (const nextId of adjacency.get(activeId) ?? []) {
			if (!path.includes(nextId)) queue.push([...path, nextId]);
		}
	}
	return null;
}

export function CompanionPanel({ copy, locale, scenario }: CompanionPanelProps) {
	const rootRef = useRef<HTMLElement>(null);
	const [isEnhanced, setIsEnhanced] = useState(false);
	const [state, setState] = useState<DialogueState>('idle');
	const [selectedPath, setSelectedPath] = useState<string[]>([]);
	const [answerRun, setAnswerRun] = useState(0);
	const reducedMotion = useReducedMotion();
	const resolvedPath = useMemo(
		() => resolvePath(scenario.questions, selectedPath),
		[scenario.questions, selectedPath],
	);
	const questionById = useMemo(
		() => new Map(scenario.questions.map((question) => [question.id, question])),
		[scenario.questions],
	);
	const selectedQuestion = resolvedPath.selected;
	const activeText = selectedQuestion?.answer ?? scenario.invitation;
	const typingRunId = selectedQuestion ? `${selectedQuestion.id}:${answerRun}` : 'invitation';
	const typing = useTypedText(
		activeText,
		typingRunId,
		state === 'inviting' || state === 'answering',
		reducedMotion,
		selectedQuestion
			? interfaceBehavior.typewriter.answerCharacterMs
			: interfaceBehavior.typewriter.invitationCharacterMs,
	);
	const nextQuestionIds = selectedQuestion
		? scenario.edges
				.filter((edge) => edge.from === selectedQuestion.id)
				.toSorted((left, right) => left.order - right.order)
				.map((edge) => edge.to)
		: scenario.entryQuestionIds;
	const questionsForLevel = nextQuestionIds
		.map((id) => questionById.get(id))
		.filter((question): question is CompanionQuestion => Boolean(question));
	const parentPath = selectedPath.slice(0, -1);
	const visibleText =
		state === 'ready' || reducedMotion ? activeText : state === 'idle' ? '…' : typing.text;
	const visibleDepth = selectedPath.length + 1;

	useEffect(() => {
		const update = window.setTimeout(() => setIsEnhanced(true), 0);
		return () => window.clearTimeout(update);
	}, []);

	useEffect(() => {
		if (!isEnhanced) return;
		const requestedId = new URL(window.location.href).searchParams.get('question');
		if (!requestedId) return;
		const requestedPath = findQuestionPath(scenario, requestedId);
		if (!requestedPath) return;
		const update = window.setTimeout(() => {
			setSelectedPath(requestedPath);
			setState('ready');
		}, 0);
		return () => window.clearTimeout(update);
	}, [isEnhanced, scenario]);

	useEffect(() => {
		const root = rootRef.current;
		if (!isEnhanced || !root || state !== 'idle') {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					setState('inviting');
					observer.disconnect();
				}
			},
			{ threshold: 0.18 },
		);
		observer.observe(root);

		return () => observer.disconnect();
	}, [isEnhanced, state]);

	useEffect(() => {
		if ((state === 'inviting' || state === 'answering') && typing.complete) {
			const timeout = window.setTimeout(() => setState('ready'), 0);
			return () => window.clearTimeout(timeout);
		}
	}, [state, typing.complete]);

	function answer(question: CompanionQuestion, path: string[]) {
		const cycleTarget = path.indexOf(question.id);
		setSelectedPath(cycleTarget >= 0 ? path.slice(0, cycleTarget + 1) : [...path, question.id]);
		setAnswerRun((current) => current + 1);
		setState('answering');
	}

	function navigate(path: string[]) {
		setSelectedPath(path);
		setState('ready');
	}

	return (
		<aside
			aria-label={copy.companion}
			className={`companion-column${isEnhanced ? ' is-enhanced' : ''}`}
			id="companion"
			ref={rootRef}
			tabIndex={-1}
		>
			{isEnhanced ? (
				<section className="companion-card" data-motion={selectedQuestion?.motion ?? 'trace'}>
					<header>
						<h2>{copy.companion}</h2>
						<div className="companion-state">
							<PulseLine compact />
							<span>{copy.companionActive}</span>
						</div>
					</header>

					<div className="companion-message">
						<i aria-hidden="true" />
						<p aria-hidden={state !== 'ready'}>
							{state === 'ready' ? renderLinkedAnswer(activeText) : visibleText}
							{state === 'inviting' || state === 'answering' ? (
								<span className="typing-caret" />
							) : null}
						</p>
						{state !== 'ready' ? (
							<p className="screen-reader-only">{state === 'idle' ? '' : activeText}</p>
						) : null}
					</div>

					<div className={`suggestions${state === 'ready' ? ' is-ready' : ''}`}>
						<div className="question-level-heading">
							<h3>{copy.suggestedQuestions}</h3>
							<small>
								{copy.questionDepth} {String(visibleDepth).padStart(2, '0')}
							</small>
						</div>

						{selectedQuestion ? (
							<nav aria-label={copy.questionPath} className="question-path">
								<ol>
									<li>
										<button onClick={() => navigate([])} type="button">
											{copy.questionRoot}
										</button>
									</li>
									{resolvedPath.nodes.map((node, index) => (
										<li key={node.id}>
											<button
												aria-current={index === resolvedPath.nodes.length - 1 ? 'step' : undefined}
												onClick={() => navigate(selectedPath.slice(0, index + 1))}
												title={node.label}
												type="button"
											>
												{node.label}
											</button>
										</li>
									))}
								</ol>
							</nav>
						) : null}

						<div className="suggestion-list">
							{selectedQuestion ? (
								<div className="question-selection">
									<button
										aria-current="true"
										className="suggestion-button is-selected"
										disabled={state !== 'ready'}
										onClick={() => answer(selectedQuestion, parentPath)}
										type="button"
									>
										<span aria-hidden="true">◆</span>
										<strong>{selectedQuestion.label}</strong>
									</button>
									<button
										aria-label={copy.backToParent}
										className="question-back"
										onClick={() => navigate(parentPath)}
										title={copy.backToParent}
										type="button"
									>
										<span aria-hidden="true">←</span>
									</button>
								</div>
							) : null}

							{questionsForLevel.map((question) => (
								<button
									className="suggestion-button"
									disabled={state !== 'ready'}
									key={question.id}
									onClick={() => answer(question, selectedPath)}
									type="button"
								>
									<span aria-hidden="true">
										{scenario.edges.some((edge) => edge.from === question.id) ? '◆' : '◇'}
									</span>
									<strong>{question.label}</strong>
								</button>
							))}
						</div>
					</div>

					<small className="companion-locale">{locale.toUpperCase()} / LOCAL SCENARIO</small>
				</section>
			) : (
				<button className="companion-js-required" disabled type="button">
					<span>{copy.companionRequiresJavaScript}</span>
					<i aria-hidden="true">→</i>
				</button>
			)}
		</aside>
	);
}
