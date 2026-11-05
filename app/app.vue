<template>
  <div class="flex h-screen">
		<SideMenu v-if="!isAuthPage" />

		<SearchModal />

    <main class="flex-1 min-w-0 h-screen overflow-y-auto">
			<NuxtPage :key="$route.fullPath"/>
    </main>
  </div>
</template>

<script lang="ts" setup>
	const route = useRoute()
	const isAuthPage = computed(() => route.path === '/login')
</script>