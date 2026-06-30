<!-- eslint-disable vue/no-v-html -->
<template>
	<div id="notes-entry" class="view --gap-none --width-100 --minHeight-100">
		<XamuLoaderContent
			el="section"
			:loading="notePending"
			:content="!notePending"
			label="Cargando nota..."
			class="view-item --minHeightVh-100 --bgColor-light"
		>
			<div v-if="note" class="holder flx --flxColumn --flx-center --gap-50">
				<ItemNote
					:note="note"
					:refresh="noteRefresh"
					:hydrate-node="hydrateNode"
					class="--width-100"
				/>
				<PaginationNotes :linked-note="note">
					<div class="txt --txtAlign-center">
						<h3 class="--txtLineHeight-sm">Respuestas</h3>
						<p class="--txtSize-sm">
							Puedes revisa las respuestas de la nota o ayudar a otros dejando una.
						</p>
					</div>
				</PaginationNotes>
			</div>
		</XamuLoaderContent>
	</div>
</template>

<script setup lang="ts">
	import { getDoc, doc, type DocumentReference } from "firebase/firestore";

	import type { Note, NoteVoteRef } from "~/utils/types";

	/**
	 * Note page
	 *
	 * @page
	 */

	definePageMeta({ middleware: ["enabled"] });

	const route = useRoute();
	const { $clientFirestore } = useNuxtApp();
	const SESSION = useSessionStore();

	const noteSlug = computed(() => {
		return route.params.noteSlug ? route.params.noteSlug : "";
	});

	const {
		data: note,
		pending: notePending,
		refresh: noteRefresh,
		error: noteError,
	} = useAsyncData<Note>(
		`api:instance:notes:${noteSlug.value}`,
		async (_, { signal }) => {
			if (!noteSlug.value) throw useCreateError("Missing note slug", 400);

			const noteApiPath = `/api/instance/notes/${noteSlug.value}`;

			return customFetch(noteApiPath, {
				method: "POST",
				signal,
				credentials: "omit",
				headers: { "Cache-Control": "no-store" },
				cache: "no-store",
			});
		},
		{ watch: [() => noteSlug.value], server: false }
	);

	function hydrateNode(newNote: Note | null, _errors?: unknown) {
		if (!newNote?.id) return;

		note.value = { ...note.value, ...newNote };
	}

	// lifecycle
	watch(
		[note, noteError],
		async ([newNote, newError]) => {
			if (newError) return showError(newError);

			if (newNote?.id) {
				// Update meta
				route.meta.title = newNote?.name || "Nota";

				if (import.meta.server || !$clientFirestore || !SESSION.path) return;

				// Get note vote
				const id = `${newNote.id}/votes/${getDocumentId(SESSION.path)}`;
				const voteRef: DocumentReference<NoteVoteRef> = doc($clientFirestore, id);
				const voteSnapshot = await getDoc(voteRef);
				const { vote = 0 } = voteSnapshot.data() || {};

				note.value = { ...note.value, vote };
			}
		},
		{ immediate: true }
	);
</script>
