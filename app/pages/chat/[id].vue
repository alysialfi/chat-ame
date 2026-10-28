<script setup lang="ts">
	const {getSessionState, startMessage, sendMessage, restoreChat} = useAiChat()

  const route = useRoute('chat-id');
  const id = computed(() => route.params.id as string)
	const chat = computed(() => getSessionState(id.value))

	const init = async (sessionId: string) => {
		if (!sessionId) return
		if (!startMessage(sessionId)) {
			try {
				await restoreChat(sessionId)
			} catch (error) {
				if (error.statusCode !== 404) {
					throw error
				}
				showError(createError({statusCode: 404, statusMessage: 'Session not found'}))
			}
		}
	}

	onBeforeMount(() => {
		init(id.value)
	})

	watch(id, (newId, oldId) => {
		if (newId && newId !== oldId) {
			init(newId)
		}
	})

	const onSend = (text: string) => sendMessage(id.value, text)
</script>

<template>
	<div class="h-screen w-full flex flex-col">
		<div class="flex-grow-1 overflow-y-auto p-4 md:p-8 lg:p-16 mb-16 w-full flex flex-col">
			<div v-for="(message, index) in chat.messages" :key="message.id ?? index" :class="message.role === 'user' ? 'ml-auto' : 'mr-auto'" class="max-w-[95%] md:max-w-[85%] min-w-0 mt-4 border-2 border-gray-400 px-4 py-2 text-gray-500 rounded-md">
				<div v-if="(index === (chat.messages.length - 1)) && !message.content">
					<div class="bg-gray-200 w-20 h-4 animate-pulse"></div>
				</div>
				<div v-if="message.content">
					<ChatBubble :content="message.content" />
				</div>
			</div>
		</div>

		<div class="fixed bottom-0 w-4/5 h-28 bg-gradient-to-b from-transparent to-white">
			<div class="px-4 md:px-8 lg:px-16 py-8">
				<InputSearch mode="prompt" :disabled="chat.readOnly || chat.isLoading" @send="onSend"/>
			</div>
		</div>
	</div>
</template>