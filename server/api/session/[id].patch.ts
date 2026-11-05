import {serverSupabaseServiceRole} from '#supabase/server'

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	if (!id) {
		throw createError({ statusCode: 400, statusMessage: 'id is required'})
	}

	const { title } = await readBody(event)
	if (typeof title !== 'string' || !title.trim()) {
		throw createError({ statusCode: 400, statusMessage: 'title must be a non-empty string' })
	}

	const supabase = serverSupabaseServiceRole(event)
	const {data, error} = await supabase.from('sessions')
		.update({title: title.trim().slice(0, 60)})
		.eq('id', id)
		.is('deleted_at', null)
		.select('id, title')

	if (error) {
		throw createError({statusCode: 500, statusMessage: error.message})
	}
	if (!data.length) {
		throw createError({statusCode: 404, statusMessage: 'Session not found'})
	}

	return data[0]
})
