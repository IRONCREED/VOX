export interface TypewriterFrame {
	runId: string;
	visibleLength: number;
}

export function visibleLengthForRun(frame: TypewriterFrame, runId: string) {
	return frame.runId === runId ? frame.visibleLength : 0;
}

export function advanceTypewriterFrame(
	frame: TypewriterFrame,
	runId: string,
	textLength: number,
	step = 2,
): TypewriterFrame {
	return {
		runId,
		visibleLength: Math.min(textLength, visibleLengthForRun(frame, runId) + step),
	};
}
