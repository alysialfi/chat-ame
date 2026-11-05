<template>
  <div class="h-full flex flex-col px-8 pb-9">
    <h1 class="flex-1 flex items-center justify-center font-mono text-sm text-mute">Hi there, {{ user?.email }}</h1>

		<InputSearch mode="sess" @send="createChat" />
  </div>
</template>

<script setup lang="ts">
  definePageMeta({
    middleware: 'auth'
  })

	const user = useSupabaseUser()
	const { createChat } = useAiChat()
</script>