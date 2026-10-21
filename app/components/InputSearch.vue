<script setup lang="ts">
	const props = defineProps<{
		mode: 'sess' | 'prompt'
		userPrompt?: string
		disabled?: boolean
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
	<div class="flex gap-2">
		<input v-model="prompt" type="text" :disabled="disabled" @keyup.enter="handler" :placeholder="disabled ? 'this session has ended (read-only)' : 'what\'s on your mind..'" class="w-3/4 border-2 border-gray-400 px-4 py-2 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed" />
		<button @click="handler" :disabled="disabled" class="w-1/4 bg-black text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">send</button>
	</div>
</template>