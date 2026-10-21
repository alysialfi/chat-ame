export const MODELS = [
	'longcat-2.5-preview-free',
	'space-bunny-free',
	'mimo-v2.6-flash-free',
	'nemotron-3-ultra-free',
	'glm-5.3-flash-free',
	'nemotron-3.5-lightning-free',
	'nemotron-3.5-super-vl-free',
	'deepseek-v4.1-flash-free',
	'beam-free',
	'big-pickle',
]

const PROVIDER_ID = 'opencode'

const exhaustedUntil = new Map<string, number>()

export function pickModel(): { providerID: string; modelID: string } | null {
	const now = Date.now()
	for (const modelID of MODELS) {
		const until = exhaustedUntil.get(modelID) ?? 0
		if (now >= until) return { providerID: PROVIDER_ID, modelID }
	}
	return null
}

export function markExhausted(modelID: string, until: number) {
	exhaustedUntil.set(modelID, until)
}
