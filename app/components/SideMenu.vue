<template>
  <nav class="h-screen w-full flex flex-col bg-neutral-50 border border-r border-gray-200">
		<NuxtLink to="/" class="p-4 flex justify-center items-center gap-1">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
				<path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clip-rule="evenodd" />
			</svg>
			New chat
		</NuxtLink>
		<ul class="flex-grow-1 overflow-y-auto">
			<li v-for="title in sessionData" :class="$route.params.id === title.id ? 'bg-gray-200 rounded-md' : 'bg-neutral-50'">
				<NuxtLink :to="`/chat/${title.id}`" class="block p-4 text-gray-600">{{ title.title }}</NuxtLink>
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
	const {getSessionState} = useAiChat()
	const { data, pending, error, refresh } = await useFetch<SessionData[]>('/api/session')

	const sessionData = ref<SessionData[]>(data.value ?? [])
	const pendingSidebarEntry = useState<SessionData | null>('pending-sidebar', () => null)

	watch(() => pendingSidebarEntry.value, (newValue, oldValue) => {
		if (newValue) {
			sessionData.value = [newValue, ...sessionData.value]
			pendingSidebarEntry.value = null
		}
	})

	watch(() => route.params.id && getSessionState(route.params.id as string).isLoading, async (isLoading, wasLoading) => {
		if (wasLoading && !isLoading) {
			await refresh()
			sessionData.value = data.value ?? []
		}
	})
</script>