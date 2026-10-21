export function useOpenCode() {
	const baseUrl = process.env.OPENCODE_LOCAL_URL
	const password = process.env.OPENCODE_LOCAL_PASSWORD
	if (!baseUrl || !password) {
		throw createError({ statusCode: 500, statusMessage: 'OPENCODE_LOCAL_URL / OPENCODE_LOCAL_PASSWORD not set' })
	}
	const username = process.env.OPENCODE_SERVER_USERNAME || 'opencode'
	const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')

	return (path: string, init: RequestInit = {}) =>
		fetch(`${baseUrl}${path}`, {
			...init,
			headers: { Authorization: authHeader, 'content-type': 'application/json', ...init.headers }
		})
}
