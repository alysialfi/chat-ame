export interface ChatMessage {
	role: 'user' | 'assistant'
	content: string
	id?: number
}
interface StreamPayload {
	sessionId?: string
	delta?: string
	error?: { message?: string }
	done?: boolean
}
export interface SessionChatState {
	messages: ChatMessage[]
	isLoading: boolean
	cursor: number | null
	allChatLoaded: boolean
	isLoadingMore: boolean
	readOnly: boolean
	loaded: boolean
	pendingPrompt: string | null
}

export interface SessionData {
	id: string
	title: string
}

const chatControllers = new Map<string, AbortController>()
const restorePromises = new Map<string, Promise<void>>()

/**
 * Parses a single SSE line ("data: {...}") and yields the payload object.
 */
function parseSseLine(line: string): StreamPayload | null {
	if (!line.startsWith('data:')) return null

	const raw = line.slice(5).trim()
	if (!raw) return null

	try {
		return JSON.parse(raw) as StreamPayload
	} catch (e) {
		console.warn('Failed to parse SSE line:', raw, e)
		return null
	}
}

/**
 * Reads an SSE stream chunk-by-chunk and triggers a callback for each parsed payload.
 */
async function readSseStream(
	body: ReadableStream<Uint8Array>,
	onPayload: (payload: StreamPayload) => void
) {
	const reader = body.getReader()
	const decoder = new TextDecoder()
	let buffer = ''

	const flushLine = (line: string) => {
		const payload = parseSseLine(line)
		if (payload) onPayload(payload)
	}

	while (true) {
		const { done, value } = await reader.read()

		if (done) {
			// Process any remaining text in the buffer after stream ends
			if (buffer.trim()) {
				buffer.split('\n').forEach(flushLine)
			}
			break
		}

		buffer += decoder.decode(value, { stream: true })
		const lines = buffer.split('\n')
		buffer = lines.pop() ?? ''

		lines.forEach(flushLine)
	}
}

function createState(): SessionChatState {
	return {
		messages: [],
		isLoading: false,
		cursor: null,
		allChatLoaded: false,
		isLoadingMore: false,
		readOnly: false,
		loaded: false,
		pendingPrompt: null
	}
}

export function useAiChat() {
	const { createSession } = useAiSession()
	const sessions = useState<Record<string, SessionChatState>>('ai-chat-sessions', () => ({}))
	const pendingSidebarEntry = useState<SessionData | null>('pending-sidebar', () => null)

	const stop = (id: string) => {
		const ac = chatControllers.get(id)
		if (ac) {
			ac.abort()
			chatControllers.delete(id)
		}
		getSessionState(id).isLoading = false
	}

	const reset = (id: string) => {
		stop(id)
		sessions.value[id] = createState()
	}

	const getSessionState = (id: string): SessionChatState => {
		if (!sessions.value[id]) {
			sessions.value[id] = createState()
		}
		return sessions.value[id]!
	}

	const takePendingPrompt = (id: string): string | null => {
		const state = getSessionState(id)
		const prompt = state.pendingPrompt
		state.pendingPrompt = null
		return prompt
	}

	const createChat = async (prompt: string) => {
		const text = prompt.trim()
		if (!text) {
			return
		}

		const id = await createSession()
		pendingSidebarEntry.value = {id, title: text.slice(0, 60)}
		getSessionState(id).pendingPrompt = text
		navigateTo(`/chat/${id}`)
	}

	const sendMessage = async (id: string, userMessage: string) => {
		const state = getSessionState(id)
		const text = userMessage.trim()
		if (!text || state.isLoading || state.readOnly) return

		state.loaded = true
		state.messages.push({ role: 'user', content: text })
		state.messages.push({ role: 'assistant', content: '' })

		const assistantMsg = state.messages[state.messages.length - 1]!
		state.isLoading = true

		const ac = new AbortController()
		chatControllers.set(id, ac)

		try {
			const response = await $fetch('/api/chat', {
				method: 'POST',
				body: { sessionId: id, message: text },
				responseType: 'stream',
				signal: ac.signal
			})

			await readSseStream(response as ReadableStream<Uint8Array>, (payload) => {
				if (payload.error) {
					throw new Error(payload.error.message ?? 'Upstream error')
				}
				if (payload.delta) {
					assistantMsg.content += payload.delta
				}
			})
		} catch (err: any) {
			if (err?.name === 'AbortError' || ac.signal.aborted) return

			const message = err?.data?.message || err?.data?.statusMessage || err?.message || 'Request failed'
			assistantMsg.content = assistantMsg.content ? `${assistantMsg.content}\n\n[Error: ${message}]` : `Error: ${message}`
		} finally {
			if (chatControllers.get(id) === ac) {
				chatControllers.delete(id)
				state.isLoading = false
			}
		}
	}

	const startMessage = (id: string): boolean => {
		const prompt = takePendingPrompt(id)
		if (!prompt) {
			return false
		}

		void sendMessage(id, prompt)
		return true
	}

	const restoreChat = async (id: string) => {
		const state = getSessionState(id)
		if (state.isLoading || state.loaded) {
			return
		}
		if (restorePromises.has(id)) {
			return restorePromises.get(id)
		}

		const promise = (async () => {
			try {
				state.cursor = null
				state.allChatLoaded = false

				const res = await $fetch<{
					data: ChatMessage[]
					nextCursor: number | null
					hasMore: boolean
					sessionAlive: boolean
				}>(`/api/chat/${id}`)

				if (state.isLoading) {
					return
				}

				state.messages = res.data as ChatMessage[]
				state.cursor = res.nextCursor
				state.allChatLoaded = !res.hasMore
				state.readOnly = !res.sessionAlive
				state.loaded = true
			} finally {
				restorePromises.delete(id)
			}
		})()

		restorePromises.set(id, promise)
		return promise
	}

	const canLoadMore = (id: string) => {
		const state = getSessionState(id)
		return !state.allChatLoaded && !state.isLoadingMore && state.cursor !== null
	}

	const loadMoreChats = async (id: string) => {
		const state = getSessionState(id)
		if (!canLoadMore(id)) {
			return
		}

		state.isLoadingMore = true
		try {
			const res = await $fetch<{
				data: ChatMessage[]
				nextCursor: number | null
				hasMore: boolean
			}>(`/api/chat/${id}`, {
				query: { cursor: state.cursor }
			})
			state.messages = [...res.data, ...state.messages]
			state.cursor = res.nextCursor
			state.allChatLoaded = !res.hasMore
		} finally {
			state.isLoadingMore	= false
		}
	}

	return {
		getSessionState,
		createChat,
		startMessage,
		sendMessage,
		canLoadMore,
		restoreChat,
		loadMoreChats,
		stop,
		reset
	}
}
