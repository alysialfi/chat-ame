export const MODELS = [
	'deepseek-v4.1-flash-free',
	'flint-40b-free',
	'mimo-v2.6-flash-free',
	'beam-free',
	'nemotron-3.5-lightning-free',
	'big-pickle',
	'glm-5.3-flash-free',
	'nemotron-3.5-super-vl-free',
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
