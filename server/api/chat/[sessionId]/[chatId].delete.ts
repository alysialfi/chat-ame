import { serverSupabaseServiceRole } from '#supabase/server'
import { assertSessionNotDeleted } from '~~/server/utils/sessions'

export default defineEventHandler(async (event) => {
	const sessionId = getRouterParam(event, 'sessionId')
	const chatId = Number(getRouterParam(event, 'chatId'))
	if (!sessionId || !Number.isInteger(chatId)) {
		throw createError({ statusCode: 400, statusMessage: 'sessionId and chatId are required' })
	}

	await assertSessionNotDeleted(event, sessionId)

	const supabase = serverSupabaseServiceRole(event)
	const { data, error } = await supabase.from('chats')
		.delete()
		.eq('id', chatId)
		.eq('session_id', sessionId)
		.select('id')

	if (error) {
		throw createError({ statusCode: 500, statusMessage: error.message })
	}
	if (!data.length) {
		throw createError({ statusCode: 404, statusMessage: 'Message not found' })
	}

	setResponseStatus(event, 204)
	return null
})
