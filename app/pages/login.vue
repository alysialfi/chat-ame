<template>
	<div class="min-h-screen flex items-center justify-center p-6">
		<div class="w-full max-w-[400px]">
			<div class="font-mono text-2xl font-semibold leading-[29px] mb-[35px]">ame</div>
			<h1 class="text-2xl font-semibold leading-[29px]">Sign in</h1>
			<p class="text-sm leading-normal text-mute mt-[9px] mb-[39px]">Welcome back. Enter your credentials to continue.</p>

			<div class="flex flex-col gap-6">
				<label for="email" class="flex flex-col gap-2 text-[13px] font-medium leading-4">
					Email
					<input type="email" name="email" id="email" v-model="email" placeholder="alfi@mail.com" @keyup.enter="login(email, password)" class="h-11 bg-side border border-line-strong px-4 text-sm font-normal outline-none focus:border-soft">
				</label>
				<label for="password" class="flex flex-col gap-2 text-[13px] font-medium leading-4">
					Password
					<input type="password" name="password" id="password" v-model="password" placeholder="••••••••" @keyup.enter="login(email, password)" class="h-11 bg-side border border-line-strong px-4 text-sm font-normal outline-none focus:border-soft">
				</label>
			</div>
			<button class="w-full h-11 mt-10 bg-ink text-canvas text-sm font-medium" @click="login(email, password)">Sign in</button>
			<p class="mt-[22px] text-center font-mono text-[11px] leading-[1.2] text-mute">Press Enter to submit</p>
		</div>
	</div>
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
