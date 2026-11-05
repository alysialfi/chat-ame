<template>
  <nav class="h-screen w-[260px] shrink-0 flex flex-col bg-side text-ink border-r border-line">
		<NuxtLink to="/" class="px-6 pt-6 font-mono text-lg font-semibold leading-[22px]">ame</NuxtLink>
		<NuxtLink to="/" class="mx-4 mt-[22px] h-10 px-4 flex items-center bg-ink text-canvas text-sm font-medium">+&nbsp;&nbsp;New chat</NuxtLink>
		<div class="px-6 mt-8 mb-3.5 font-mono text-[11px] font-medium uppercase leading-[14px] text-mute">Recent</div>
		<ul class="flex-1 overflow-y-auto">
			<li v-for="title in sessionData" :key="title.id" :class="$route.params.id === title.id ? 'bg-active text-ink font-medium' : 'text-mute hover:bg-active'" class="group mx-3 mb-2 h-9 pl-3 pr-2 flex items-center gap-2">
				<input
					v-if="editingId === title.id"
					v-model="editTitle"
					type="text"
					maxlength="60"
					@vue:mounted="({ el }) => el.focus()"
					class="flex-1 min-w-0 h-7 bg-canvas border border-line-strong text-ink text-[13px] font-normal px-2 outline-none focus:border-soft"
					@keyup.enter="onRename(title.id)"
					@keyup.esc="editingId = null"
					@blur="editingId = null"
				/>
				<NuxtLink v-else :to="`/chat/${title.id}`" class="flex-1 min-w-0 h-full flex items-center text-[13px]"><span class="truncate">{{ title.title }}</span></NuxtLink>
				<div v-if="editingId !== title.id" :class="$route.params.id === title.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'" class="flex items-center gap-2 text-soft">
					<button type="button" aria-label="Rename chat" class="hover:text-ink" @click="startRename(title)">
						<IconEdit />
					</button>
					<button type="button" aria-label="Delete chat" class="hover:text-danger" @click="onDelete(title.id)">
						<IconTrash />
					</button>
				</div>
			</li>
		</ul>
		<button type="button" class="h-14 shrink-0 px-6 border-t border-line flex items-center font-mono text-xs text-mute hover:text-ink" @click="isModalActive = true">Search&nbsp;&nbsp;⌘K</button>
	</nav>
</template>

<script lang="ts" setup>
	type SessionData = {
		id: string
		title: string
	}
	const route = useRoute()
	const { reset } = useAiChat()
	const { deleteSession, renameSession } = useAiSession()
	const { data, pending, error, refresh } = await useFetch<SessionData[]>('/api/session')

	const sessionData = useState<SessionData[]>('session-list', () => data.value ?? [])
	const pendingSidebarEntry = useState<SessionData | null>('pending-sidebar', () => null)
	const isModalActive = useState<boolean>('is-modal-active', () => false)

	const onKeydown = (e: KeyboardEvent) => {
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault()
			isModalActive.value = true
		}
	}
	onMounted(() => window.addEventListener('keydown', onKeydown))
	onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

	const editingId = ref<string | null>(null)
	const editTitle = ref<string>('')

	const startRename = (session: SessionData) => {
		editingId.value = session.id
		editTitle.value = session.title ?? ''
	}

	const onRename = async (id: string) => {
		const title = editTitle.value.trim()
		editingId.value = null
		if (!title) return

		const previous = sessionData.value
		sessionData.value = previous.map(s => s.id === id ? { ...s, title } : s)

		try {
			await renameSession(id, title)
		} catch (error) {
			sessionData.value = previous
		}
	}

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