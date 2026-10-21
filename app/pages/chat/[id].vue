<script setup lang="ts">
	const {messages, startMessage, sendMessage, restoreChat, readOnly} = useAiChat()

  const route = useRoute('chat-id');
  const sessId = route.params.id
	const initialPrompt = useState('initial-prompt', () => '')

	onBeforeMount(async () => {
		if (initialPrompt.value) {
			startMessage(sessId)
		} else {
			await restoreChat(sessId)
		}
	})
</script>

<template>
	<div class="h-screen w-full flex flex-col">
		<div class="flex-grow-1 overflow-y-auto p-16 mb-16 w-full flex flex-col">
			<div v-for="(message, id) in messages" :key="id" :class="message.role === 'user' ? 'ml-auto' : 'mr-auto'" class="max-w-full mt-4 border-2 border-gray-400 px-4 py-2 text-gray-500 rounded-md">
				<div v-if="(id === (messages.length - 1)) && !message.content">
					<div class="bg-gray-200 w-20 h-4 animate-pulse"></div>
				</div>
				<div v-if="message.content">
					<ChatBubble :content="message.content" />
				</div>
			</div>
		</div>

		<div class="fixed bottom-0 w-[80%] h-28 bg-gradient-to-b from-transparent to-white">
			<div class="px-16 py-8">
				<InputSearch mode="prompt" :disabled="readOnly" @send="sendMessage"/>
			</div>
		</div>
	</div>
</template>