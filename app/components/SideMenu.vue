<template>
  <nav class="h-screen w-full flex flex-col bg-neutral-50 border border-r border-gray-200">
		<NuxtLink to="/" class="p-4 flex justify-center items-center gap-1">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
				<path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clip-rule="evenodd" />
			</svg>
			New chat
		</NuxtLink>
		<ul class="flex-grow-1 overflow-y-auto">
			<li v-for="title in sessionData" :class="$route.params.id === title.id ? 'bg-gray-200 rounded-md' : 'bg-neutral-50'" class="group flex justify-between items-center">
				<NuxtLink :to="`/chat/${title.id}`" class="block p-4 text-gray-600">{{ title.title }}</NuxtLink>
				<button type="button" aria-label="Delete chat" class="p-2 mr-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100" @click="onDelete(title.id)">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
						<path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clip-rule="evenodd" />
					</svg>
        </button>
			</li>
		</ul>
	</nav>
</template>

<script lang="ts" setup>
	type SessionData = {
		id: string
		title: string
	}
	const route = useRoute()
	const { reset } = useAiChat()
	const { deleteSession } = useAiSession()
	const { data, pending, error, refresh } = await useFetch<SessionData[]>('/api/session')

	const sessionData = ref<SessionData[]>(data.value ?? [])
	const pendingSidebarEntry = useState<SessionData | null>('pending-sidebar', () => null)

	const onDelete = async (id: string) => {
		if (!confirm('Are you sure you want to delete this chat?')) return

		const previous = sessionData.value
		sessionData.value = previous.filter(s => s.id !== id)

		try {
			await deleteSession(id)
			reset(id)
			if (route.params.id === id) {
				navigateTo('/')
			}
		} catch (error) {
			sessionData.value = previous
		}
	}
	watch(() => pendingSidebarEntry.value, (newValue, oldValue) => {
		if (newValue) {
			sessionData.value = [newValue, ...sessionData.value]
			pendingSidebarEntry.value = null
		}
	})

	// Sessions are persisted server-side only when a response finishes, so refresh when
	// any session stops loading, not just the one being viewed.
	const chatSessions = useState<Record<string, { isLoading: boolean }>>('ai-chat-sessions', () => ({}))
	const anyLoading = computed(() => Object.values(chatSessions.value).some(s => s.isLoading))

	watch(anyLoading, async (isLoading, wasLoading) => {
		if (wasLoading && !isLoading) {
			await refresh()
			sessionData.value = data.value ?? []
		}
	})
</script>