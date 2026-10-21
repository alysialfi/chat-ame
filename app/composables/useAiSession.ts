export default function() {
	const sessionId = ref<string | null>(null)

	const getSession = async () => {
		const res = await $fetch('/api/session', {
			method: 'POST'
		})
		sessionId.value = res.sessionId
	}

	return { getSession, sessionId }
}