<script setup lang="ts">
	const props = defineProps<{
		content: string
	}>()
</script>

<template>
	<div>
		<MDC :value="props.content" tag="article" class="prose truncate"/>
	</div>
</template>