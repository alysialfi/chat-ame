<template>
  <div v-if="isModalActive" class="absolute w-screen h-screen flex justify-center items-center bg-black bg-opacity-60">
    <div class="w-1/3 h-96 bg-side border border-line text-ink p-8">
			<button @click="isModalActive = false" class="w-full ml-auto">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
					<path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clip-rule="evenodd" />
				</svg>
			</button>
			<div>
				<input type="text" placeholder="search" class="w-full bg-canvas border border-line-strong text-ink p-2 text-sm outline-none focus:border-soft">
			</div>
		</div>
  </div>
</template>

<script lang="ts" setup>
	const isModalActive = useState<boolean>('is-modal-active', () => false)
</script>
