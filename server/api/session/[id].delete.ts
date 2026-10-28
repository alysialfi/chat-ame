import {serverSupabaseServiceRole} from '#supabase/server'

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	if (!id) {
		throw createError({ statusCode: 400, statusMessage: 'id is required'})
	}

	const supabase = serverSupabaseServiceRole(event)
	const dateNow = new Date().toISOString()
	const {data, error} = await supabase.from('sessions')
	.update({deleted_at: dateNow})
	.eq('id', id)
	.is('deleted_at', null)
	.select('id')

	if (error) {
		throw createError({statusCode: 500, statusMessage: error.message})
	}
	if (!data.length) {
		throw createError({statusCode: 404, statusMessage: 'Session not found'})
	}

	setResponseStatus(event, 204)
	return null
})
