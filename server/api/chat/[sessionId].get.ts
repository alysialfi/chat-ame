import { serverSupabaseServiceRole } from '#supabase/server'
const PAGE_SIZE = 20

export default defineEventHandler(async (event) => {

	const sessionId = getRouterParam(event, 'sessionId')
	if (!sessionId) {
		throw createError({ statusCode: 400, statusMessage: 'sessionId is required' })
	}

	const { cursor } = getQuery(event)

	// Only check session liveness on the first page load (no cursor)
	let sessionAlive = true
	if (!cursor) {
		try {
			const ocFetch = useOpenCode()
			const res = await ocFetch(`/session/${sessionId}`)
			sessionAlive = res.status !== 404
		} catch {
			sessionAlive = true // OpenCode unreachable — don't lock the chat
		}
	}

	const supabase = serverSupabaseServiceRole(event)
	let query = supabase
		.from('chats')
		.select('id, role, content')
		.eq('session_id', sessionId)
		.order('id', { ascending: false })
		.limit(PAGE_SIZE + 1)

	if (cursor) {
		query = query.lt('id', Number(cursor))
	}

	const { data, error } = await query

	if (error) {
		throw createError({ statusCode: 500, statusMessage: error.message })
	}

	const rows = data ?? []
	const hasMore = rows.length > PAGE_SIZE
	const actualRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows
	const oldest = actualRows.at(-1)

	return {
		data: actualRows.reverse().map(({id, role, content}) => ({id, role, content})),
		hasMore,
		sessionAlive,
		nextCursor: oldest ? Number(oldest.id) : null
	}
})
