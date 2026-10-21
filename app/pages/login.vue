<template>
	<div>Login</div>
	<div class="flex gap-4">
		<input type="email" name="email" id="email" v-model="email" placeholder="alfi@mail.com" class="border border-gray-200 px-4">
		<input type="text" name="password" id="password" v-model="password" class="border border-gray-200 px-4">
	</div>
	<button class="" @click="login(email, password)">Login</button>
</template>

<script setup lang="ts">
	const supabase = useSupabaseClient()
	const user = useSupabaseUser()

	const email = ref<string>('')
	const password = ref<string>('')

	const login = async (email: string, password: string) => {
		const { data, error } = await supabase.auth.signInWithPassword({ email, password })
		if (data?.user?.id) {
			navigateTo('/')
		}
	}
</script>
