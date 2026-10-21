export interface ChatMessage {
	role: 'user' | 'assistant'
	content: string
}

interface StreamPayload {
	sessionId?: string
	delta?: string
	error?: { message?: string }
}

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

export function useAiChat() {
	const { getSession, sessionId } = useAiSession()
	const messages = ref<ChatMessage[]>([])
	const isLoading = ref(false)
	// const sessionId = ref<string | null>(null)
	const initialPrompt = useState<string>('initial-prompt', () => '')

	// pagination
	const cursor = ref<number | null>(null)
	const allChatLoaded = ref<boolean>(false)
	const isLoadingMore = ref<boolean>(false)
	// true when the OpenCode session no longer exists (history viewable, no new prompts)
	const readOnly = ref<boolean>(false)

	let abortController: AbortController | null = null

	const stop = () => {
		if (abortController) {
			abortController.abort()
			abortController = null
		}
		isLoading.value = false
	}

	const reset = () => {
		stop()
		messages.value = []
		sessionId.value = null
		cursor.value = null
		allChatLoaded.value = false
		readOnly.value = false
	}

	const createChat = async (prompt: string) => {
		await getSession()
		initialPrompt.value = prompt
		navigateTo(`/chat/${sessionId.value}`)
	}

	const startMessage = async (id: string) => {
		sessionId.value = id
		sendMessage(initialPrompt.value)
		// initialPrompt.value = ''
	}

	const sendMessage = async (userMessage: string) => {
		const text = userMessage.trim()
		if (!text || isLoading.value || readOnly.value) return

		messages.value.push({ role: 'user', content: text })
		messages.value.push({ role: 'assistant', content: '' })

		const assistantMsg = messages.value[messages.value.length - 1]!
		isLoading.value = true
		abortController = new AbortController()

		try {
			const response = await $fetch('/api/chat', {
				method: 'POST',
				body: { sessionId: sessionId.value, message: text },
				responseType: 'stream',
				signal: abortController.signal
			})

			await readSseStream(response as ReadableStream<Uint8Array>, (payload) => {
				if (payload.error) {
					throw new Error(payload.error.message ?? 'Upstream error')
				}
				if (payload.sessionId) {
					sessionId.value = payload.sessionId
				}
				if (payload.delta) {
					assistantMsg.content += payload.delta
				}
			})
		} catch (err: any) {
			if (err?.name === 'AbortError' || abortController?.signal.aborted) return

			const message = err?.data?.message || err?.data?.statusMessage || err?.message || 'Request failed'
			assistantMsg.content = assistantMsg.content ? `${assistantMsg.content}\n\n[Error: ${message}]` : `Error: ${message}`
		} finally {
			abortController = null
			isLoading.value = false
		}
	}

	const restoreChat = async (id: string) => {
		sessionId.value = id
		cursor.value = null
		allChatLoaded.value = false

		const res = await $fetch(`/api/chat/${sessionId.value}`)

		messages.value = res.data as ChatMessage[]
		cursor.value = res.nextCursor
		allChatLoaded.value = !res.hasMore
		readOnly.value = !res.sessionAlive
	}

	const canLoadMore = computed(() => {
		return !allChatLoaded.value && !isLoadingMore.value && !!sessionId.value
	})

	const loadMoreChats = async () => {
		if (!canLoadMore.value) {
			return
		}

		isLoadingMore.value = true
		try {
			const res = await $fetch(`/api/chat/${sessionId.value}`, {
				query: { cursor: cursor.value }
			})
			messages.value = [...res.data as ChatMessage[], ...messages.value]
			cursor.value = res.nextCursor
			allChatLoaded.value = !res.hasMore
		} finally {
			isLoadingMore.value	= false
		}
	}

	return {
		messages,
		isLoading,
		sessionId,
		createChat,
		startMessage,
		sendMessage,
		canLoadMore,
		restoreChat,
		loadMoreChats,
		allChatLoaded,
		readOnly,
		stop,
		reset
	}
}
