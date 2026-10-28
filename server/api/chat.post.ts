import { storeToChatsTable } from '../utils/chats'

export default defineEventHandler(async (event) => {
	const ocFetch = useOpenCode()

	const { message, sessionId } = await readBody(event)
	if (typeof message !== 'string' || !message.trim()) {
		throw createError({ statusCode: 400, statusMessage: 'message must be a non-empty string' })
	}
	if (sessionId !== undefined && sessionId !== null && typeof sessionId !== 'string') {
		throw createError({ statusCode: 400, statusMessage: 'sessionId must be a string' })
	}

	const upstreamError = async (res: Response) => {
		const text = await res.text().catch(() => '')
		return createError({ statusCode: 502, statusMessage: 'OpenCode error', message: text || `HTTP ${res.status}` })
	}

	const ac = new AbortController()
	const events = await ocFetch('/event', { headers: { accept: 'text/event-stream' }, signal: ac.signal })
	if (!events.ok || !events.body) throw await upstreamError(events)

	const sendPrompt = (m: { providerID: string; modelID: string }) =>
		ocFetch(`/session/${sessionId}/prompt_async`, {
			method: 'POST',
			body: JSON.stringify({ model: m, parts: [{ type: 'text', text: message }] })
		})

	type ModelRef = { providerID: string; modelID: string }
	const first = pickModel()
	if (!first) {
		ac.abort()
		throw createError({ statusCode: 429, statusMessage: 'All models quota exceeded' })
	}
	let model: ModelRef = first
	// set while the quota-hit run is being aborted; holds the model to retry with
	let pendingModel: ModelRef | null = null

	const prompt = await sendPrompt(model)
	if (!prompt.ok) {
		ac.abort()
		throw await upstreamError(prompt)
	}

	const encoder = new TextEncoder()
	const decoder = new TextDecoder()
	const roles = new Map<string, string>()
	const partTypes = new Map<string, string>()
	let assistantText = ''

	const stream = new ReadableStream({
		async start(controller) {
			const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
			send({ sessionId })

			try {
				const reader = events.body!.getReader()
				let buffer = ''
				let finished = false

				while (!finished) {
					const { done, value } = await reader.read()
					if (done) break
					buffer += decoder.decode(value, { stream: true })
					const lines = buffer.split('\n')
					buffer = lines.pop() ?? ''

					for (const line of lines) {
						if (!line.startsWith('data:')) continue
						let evt: any
						try { evt = JSON.parse(line.slice(5).trim()) } catch { continue }
						const props = evt?.properties ?? {}

						if (evt.type === 'message.updated' && props.info?.sessionID === sessionId) {
							roles.set(props.info.id, props.info.role)
						} else if (evt.type === 'message.part.updated') {
							const part = props.part
							if (part?.sessionID === sessionId) partTypes.set(part.id, part.type)
						} else if (evt.type === 'message.part.delta') {
							if (props.sessionID !== sessionId || props.field !== 'text' || !props.delta) continue
							if (partTypes.get(props.partID) !== 'text') continue
							if (roles.get(props.messageID) === 'user') continue
							assistantText += props.delta
							send({ delta: props.delta })
						} else if (
							evt.type === 'session.status' && props.sessionID === sessionId &&
							props.status?.type === 'retry'
						) {
							if (pendingModel) continue // already switching
							// free_tier_limit: mark exhausted until quota resets
							// other errors (e.g. model unavailable): mark exhausted for 5 minutes
							const until = props.status?.action?.reason === 'free_tier_limit'
								? (props.status.next ?? Date.now() + 60 * 60 * 1000)
								: Date.now() + 5 * 60 * 1000
							markExhausted(model.modelID, until)
							const next = pickModel()
							if (!next) {
								ocFetch(`/session/${sessionId}/abort`, { method: 'POST' }).catch(() => {})
								send({ error: { message: 'All models quota exceeded' } })
								finished = true
								continue
							}
							pendingModel = next
							await ocFetch(`/session/${sessionId}/abort`, { method: 'POST' }).catch(() => {})
						} else if (
							(evt.type === 'session.idle' || evt.type === 'session.error') &&
							props.sessionID === sessionId && pendingModel
						) {
							// the aborted run settled: resend the prompt with the next model
							model = pendingModel
							pendingModel = null
							const retry = await sendPrompt(model)
							if (!retry.ok) {
								send({ error: { message: `OpenCode error: HTTP ${retry.status}` } })
								finished = true
							}
						} else if (evt.type === 'session.error' && props.sessionID === sessionId) {
							const err = props.error
							send({ error: { message: err?.data?.message ?? err?.name ?? 'OpenCode session error' } })
							finished = true
						} else if (evt.type === 'session.idle' && props.sessionID === sessionId) {
							await storeToChatsTable(event, sessionId, message, assistantText)
							send({ done: true })
							finished = true
						}
					}
				}
			} catch (e) {
				if (!ac.signal.aborted) send({ error: { message: e instanceof Error ? e.message : 'Stream failed' } })
			} finally {
				if (ac.signal.aborted) await storeToChatsTable(event, sessionId, message, assistantText)
				ac.abort()
				try { controller.close() } catch {}
			}
		},
		cancel() {
			ac.abort()
		}
	})

	setResponseHeader(event, 'content-type', 'text/event-stream')
	setResponseHeader(event, 'cache-control', 'no-cache')
	return sendStream(event, stream)
})
