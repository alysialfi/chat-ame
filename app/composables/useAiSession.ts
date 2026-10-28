export default function() {
	const createSession = async (): Promise<string> => {
		const res = await $fetch<{sessionId: string}>('/api/session', {
			method: 'POST'
		})
		return res.sessionId
	}

	const deleteSession = async (id: string): Promise<void> => {
		await $fetch(`/api/session/${id}`, {
			method: 'DELETE'
		})
	}

	return { createSession, deleteSession }
}