import type {H3Event} from 'h3'
import {serverSupabaseServiceRole} from '#supabase/server'

export async function assertSessionNotDeleted(event: H3Event, sessionId: string) {
	const supabase = serverSupabaseServiceRole(event)
	const {data: session, error: sessionError} = await supabase.from('sessions').select('deleted_at').eq('id', sessionId).maybeSingle()

	if(session?.deleted_at) {
		throw createError({ statusCode: 404, statusMessage: 'Session not found' })
	}
}
