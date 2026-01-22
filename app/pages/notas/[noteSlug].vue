<!-- eslint-disable vue/no-v-html -->
<template>
	<div id="notes-entry" class="view --gap-none --width-100 --minHeight-100">
		<section class="view-item --minHeightVh-100 --bgColor-light">
			<ClientOnly>
				<template #fallback>Cargando nota...</template>
				<XamuLoaderContent
					:loading="notePending"
					:content="!notePending"
					label="Cargando nota..."
					class="holder flx --flxColumn --flx-center"
				>
					<ItemNote
						v-if="note"
						:note="note"
						:refresh="noteRefresh"
						:hydrate-node="hydrateNode"
						class="--width-100"
					/>
				</XamuLoaderContent>
			</ClientOnly>
		</section>
	</div>
</template>

<script setup lang="ts">
	import type { Note } from "~/utils/types";

	/**
	 * Note page
	 *
	 * @page
	 */

	definePageMeta({ middleware: ["enabled", "auth-only"] });

	const route = useRoute();
	const { cache } = useRuntimeConfig().public;

	const noteSlug = computed(() => {
		return route.params.noteSlug ? route.params.noteSlug : "";
	});

	const {
		data: note,
		pending: notePending,
		refresh: noteRefresh,
		error: noteError,
	} = useAsyncData(
		`api:instance:notes:${noteSlug.value}`,
		async () => {
			const noteApiPath = `/api/instance/notes/${noteSlug.value}`;

			return useCsrfQuery<Note>(noteApiPath, {
				method: "POST",
				headers: { "Cache-Control": cache.frequent },
				cache: "reload",
			});
		},
		{ watch: [() => noteSlug.value], server: false }
	);

	function hydrateNode(newNote: Note | null, _errors?: unknown) {
		if (!newNote) return;

		note.value = { ...note.value, ...newNote };
	}

	// lifecycle
	watch(
		[note, noteError],
		([newNote, newError]) => {
			if (newError) return showError(newError);

			if (newNote) {
				// Update meta
				route.meta.title = newNote?.name || "Nota";
			}
		},
		{ immediate: true }
	);
</script>
