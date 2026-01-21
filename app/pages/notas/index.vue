<template>
	<div id="note" class="view --gap-none">
		<section class="view-item --minHeightVh-100 --bgColor-light">
			<div class="holder flx --flxColumn --flx-center">
				<div class="txt --txtAlign-center">
					<h1 class="--txtLineHeight-sm">Notas</h1>
					<p>Encuentra notas útiles o comparte una.</p>
				</div>
				<div v-if="!emittedHasContent" class="--width-100 --maxWidth-770">
					<XamuBoxEditor
						v-model="newNoteBody"
						placeholder="Comparte algo que te guste..."
						class="--width-100 --flx"
					>
						<template #submit>
							<XamuActionButton
								:disabled="!newNoteBody"
								tooltip="Publicar nota"
								tooltip-position="bottom"
								round
								@click="saveNote"
							>
								<XamuIconFa name="paper-plane" />
							</XamuActionButton>
						</template>
					</XamuBoxEditor>
				</div>
				<ClientOnly>
					<template #fallback>Cargando notas...</template>
					<XamuPaginationContent
						v-slot="{ content }"
						:page="notesPage"
						url="api:instance:notes"
						:defaults="{ level: 1, page: true }"
						no-content-message="No hay notas disponibles, puedes crear una."
						label="Cargando notas..."
						class="grd --grdColumns-auto3 --maxWidth-770 --gap-20"
						hide-controls="single"
						with-route
						client
						@refresh="emittedRefresh = $event"
						@has-content="hasContent"
					>
						<XamuBoxEditor v-model="newNoteBody" class="grd-item x-editor-span">
							<template #submit>
								<XamuActionButton
									:disabled="!newNoteBody"
									tooltip="Publicar nota"
									tooltip-position="bottom"
									round
									@click="saveNote"
								>
									<XamuIconFa name="paper-plane" />
								</XamuActionButton>
							</template>
						</XamuBoxEditor>
						<ItemNote
							v-for="(note, noteIndex) in content"
							:key="note.id ?? noteIndex"
							:note="note"
							class="grd-item"
						/>
					</XamuPaginationContent>
				</ClientOnly>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
	import type { iGetPage, iPage } from "@open-xamu-co/ui-common-types";

	import type { Note, NoteRef } from "~/utils/types";

	type HydrateNodes = (newContent: Note[] | null, newErrors?: unknown) => void;

	/**
	 * Note page
	 *
	 * @page
	 */

	definePageMeta({ title: "Notas", middleware: ["enabled", "auth-only"] });

	const { cache } = useRuntimeConfig().public;
	const Swal = useSwal();
	const USER = useUserStore();

	const emittedRefresh = ref<() => void>();
	const emittedContent = ref<Note[] | null>();
	const emittedHasContent = ref<boolean>();
	const emittedHydrateNodes = ref<HydrateNodes>();

	const newNoteBody = ref<string>("");

	const notesPage: iGetPage<Note> = (pagination) => {
		return useCsrfQuery<iPage<Note> | undefined>("/api/instance/notes", {
			method: "POST",
			query: pagination,
			headers: { "Cache-Control": cache.frequent },
		});
	};

	async function saveNote(): Promise<boolean | undefined> {
		if (!newNoteBody.value) return;

		// TODO: Use modal instead of Swal
		const { value, isConfirmed } = await Swal.fire({
			title: "Nueva nota",
			html: `
				<div class="flx --flxColumn --flx-start-stretch">
					<div class="flx --flxColumn --flx-start --gap-5">
						<p class="--txtSize-sm">Nombre de la nota*</p>
						<div class="--flx flx --flxRow --flx-center --gap-5 --width-100">
							<div class="iTxt">
								<input id="swal-name-input" type="text" placeholder="Nombre..." autocomplete="on">
								<i aria-hidden="true" class="fa-note-sticky fas icon"></i>
							</div>
						</div>
					</div>
					<div class="flx --flxColumn --flx-start --gap-5">
						<p class="--txtSize-sm">Lecturas máximas (0 = ilimitado)</p>
						<div class="--flx flx --flxRow --flx-center --gap-5 --width-100">
							<div class="iTxt">
								<input id="swal-reads-input" type="number" placeholder="Lecturas máximas..." min="0" value="0">
								<i aria-hidden="true" class="fa-eye fas icon"></i>
							</div>
						</div>
					</div>
				</div>
			`,
			showConfirmButton: true,
			confirmButtonText: "Añadir nota",
			showCancelButton: true,
			focusConfirm: false, // Prevent auto-focus on confirm button
			preConfirm: () => {
				const nameInput = document.getElementById("swal-name-input") as HTMLInputElement;
				const readsInput = document.getElementById("swal-reads-input") as HTMLInputElement;
				const name = nameInput.value.trim();
				const reads: number | false = Number(readsInput.value.trim() || 0) || false;

				if (!name) return;

				return { name, reads };
			},
			timer: undefined,
		});

		if (!isConfirmed || !value) return;

		const [data] = await useDocumentCreate<NoteRef>(`${USER.path}/notes`, {
			body: newNoteBody.value,
			name: value.name,
		});

		const [newNote] = Array.isArray(data) ? data : [data];

		if (typeof newNote !== "object") {
			Swal.fire({
				icon: "error",
				title: "Error",
				text: "Hubo un error al crear la nota",
			});

			return false;
		}

		// TODO: Hydrate note, do not await

		return !!newNote;
	}

	/**
	 * Handles content emission
	 */
	function hasContent(value: boolean, content?: Note[] | null, hydrateNodes?: HydrateNodes) {
		emittedHasContent.value = value;
		emittedContent.value = content;
		emittedHydrateNodes.value = hydrateNodes;
	}
</script>

<style scoped lang="scss">
	.x-editor-span {
		grid-column: 1/ -1;
	}
</style>
