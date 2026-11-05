<script setup lang="ts">
	const {getSessionState, startMessage, sendMessage, restoreChat, editMessage, deleteMessage} = useAiChat()

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

	const sessionList = useState<{ id: string, title: string }[]>('session-list', () => [])
	const title = computed(() => sessionList.value.find(s => s.id === id.value)?.title || 'New chat')

	const editingMessageId = ref<number | null>(null)
	const editText = ref<string>('')

	const startEdit = (message: { id?: number, content: string }) => {
		editingMessageId.value = message.id ?? null
		editText.value = message.content
	}

	const saveEdit = async () => {
		if (editingMessageId.value === null) return
		const messageId = editingMessageId.value
		editingMessageId.value = null
		try {
			await editMessage(id.value, messageId, editText.value)
		} catch (error) {
			alert('Failed to edit message')
		}
	}

	const onDeleteMessage = async (messageId: number) => {
		if (!confirm('Are you sure you want to delete this message?')) return
		try {
			await deleteMessage(id.value, messageId)
		} catch (error) {
			alert('Failed to delete message')
		}
	}

	const onSend = (text: string) => sendMessage(id.value, text)
</script>

<template>
	<div class="h-full flex flex-col">
		<header class="h-[60px] shrink-0 px-8 flex items-center border-b border-line">
			<h1 class="text-[15px] font-semibold truncate">{{ title }}</h1>
		</header>

		<div class="flex-1 min-h-0 overflow-y-auto px-8 pt-9 pb-5 flex flex-col gap-5">
			<div v-for="(message, index) in chat.messages" :key="message.id ?? index" :class="message.role === 'user' ? 'ml-auto max-w-[484px]' : 'mr-auto max-w-[700px]'" class="min-w-0 w-fit text-sm text-ink">
				<div v-if="message.role !== 'user'" class="font-mono text-[11px] font-medium leading-[14px] mb-2.5">&gt; ame</div>
				<div :class="message.role === 'user' ? 'bg-active border border-line p-5 leading-[1.5]' : 'leading-[1.6]'">
					<div v-if="(index === (chat.messages.length - 1)) && !message.content">
						<div class="bg-line w-20 h-4 animate-pulse"></div>
					</div>
					<div v-if="message.id !== undefined && editingMessageId === message.id">
						<textarea v-model="editText" rows="4" class="w-full min-w-[320px] bg-canvas border border-line-strong text-ink text-sm p-3 outline-none focus:border-soft"></textarea>
						<div class="flex gap-2 mt-2 font-mono text-[11px]">
							<button type="button" class="bg-ink text-canvas px-3 py-1" @click="saveEdit">save</button>
							<button type="button" class="border border-line-strong text-soft px-3 py-1" @click="editingMessageId = null">cancel</button>
						</div>
					</div>
					<div v-else-if="message.content">
						<ChatBubble :content="message.content" />
					</div>
				</div>
				<div v-if="message.id !== undefined && !chat.isLoading && editingMessageId !== message.id" :class="message.role === 'user' ? 'justify-end' : ''" class="flex gap-2 mt-2 text-mute">
					<button type="button" aria-label="Edit message" class="hover:text-ink" @click="startEdit(message)">
						<IconEdit />
					</button>
					<button type="button" aria-label="Delete message" class="hover:text-danger" @click="onDeleteMessage(message.id)">
						<IconTrash />
					</button>
				</div>
			</div>
		</div>

		<div class="shrink-0 px-8 pb-9 pt-4">
			<InputSearch mode="prompt" :disabled="chat.readOnly || chat.isLoading" :read-only="chat.readOnly" @send="onSend"/>
		</div>
	</div>
</template>
