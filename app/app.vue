<template>
  <div class="flex">
		<div class="w-1/5">
			<SideMenu />
		</div>

    <main class="w-4/5">
			<NuxtPage :key="$route.fullPath"/>
    </main>
  </div>
</template>

<script setup>
</script>