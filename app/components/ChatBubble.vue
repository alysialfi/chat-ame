<script setup lang="ts">
	const props = defineProps<{
		content: string
	}>()
</script>

<template>
	<div>
		<MDC :value="props.content" tag="article" class="prose max-w-none break-words whitespace-normal overflow-x-auto"/>
	</div>
</template>