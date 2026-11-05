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

	const renameSession = async (id: string, title: string): Promise<void> => {
		await $fetch(`/api/session/${id}`, {
			method: 'PATCH',
			body: { title }
		})
	}

	return { createSession, deleteSession, renameSession }
}