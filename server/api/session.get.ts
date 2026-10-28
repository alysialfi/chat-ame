import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
	const supabase = serverSupabaseServiceRole(event)
	const { data, error } = await supabase.from('sessions').select('id, title').is('deleted_at', null).order('updated_at', {ascending: false})

	if (error) {
		throw createError({ statusCode: 500, statusMessage: error.message })
	}

	return data
})
