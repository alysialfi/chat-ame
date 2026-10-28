export default function() {
	const createSession = async (): Promise<string> => {
		const res = await $fetch<{sessionId: string}>('/api/session', {
			method: 'POST'
		})
		return res.sessionId
	}

	return { createSession }
}