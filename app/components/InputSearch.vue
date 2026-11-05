<script setup lang="ts">
	const props = defineProps<{
		mode: 'sess' | 'prompt'
		userPrompt?: string
		disabled?: boolean
		readOnly?: boolean
	}>()
	const emit = defineEmits<{
		send: [string]
	}>()
	const prompt =  ref<string>('')

	const handler = () => {
		if (props.disabled) return
		emit('send', prompt.value)
		prompt.value = ''
	}
</script>

<template>
	<div class="flex items-center gap-3 h-14 pl-6 pr-3 bg-side border border-line-strong focus-within:border-soft">
		<input v-model="prompt" type="text" :disabled="disabled" @keyup.enter="handler" :placeholder="readOnly ?'this session has ended (read-only)' : 'Ask anything…'" class="flex-1 min-w-0 bg-transparent text-ink text-sm outline-none disabled:cursor-not-allowed" />
		<button @click="handler" :disabled="disabled" aria-label="Send" class="shrink-0 w-10 h-9 bg-ink text-canvas font-mono text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed">↵</button>
	</div>
</template>
