<template>
  <div class="h-screen p-16">
    <h1 class="text-gray-500 mb-10">Hi there, {{ user.email }}</h1>

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