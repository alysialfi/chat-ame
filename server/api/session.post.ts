export default defineEventHandler(async (event) => {
  const ocFetch = useOpenCode()
	const res = await ocFetch('/session', { method: 'POST', body: '{}' })
	if (!res.ok) {
		const text = await res.text().catch(() => '')
		throw createError({ statusCode: 502, statusMessage: 'OpenCode error', message: text || `HTTP ${res.status}` })
	}
	const data = await res.json()
	return { sessionId: data.id as string }
})
