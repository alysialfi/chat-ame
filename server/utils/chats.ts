import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export async function storeToChatsTable(event: H3Event, sessionId: string, userContent: string, assistantContent: string) {
	const supabase = serverSupabaseServiceRole(event)

	const { error: sessionError } = await supabase.from('sessions').upsert({ id: sessionId }, { onConflict: 'id', ignoreDuplicates: true })
	if (sessionError) {
		console.error('Failed to ensure session', sessionError)
		return
	}

	const { error, data } = await supabase.from('chats').insert([
		{ session_id: sessionId, role: 'user', content: userContent },
		{ session_id: sessionId, role: 'assistant', content: assistantContent },
	])

	await supabase.from('sessions')
		.update({ updated_at: new Date().toISOString() })
		.eq('id', sessionId)

	await supabase
		.from('sessions')
		.update({ title: userContent.slice(0, 60) })
		.eq('id', sessionId)
		.is('title', null)

	if (error) console.error('Failed to store chat history', error)
}