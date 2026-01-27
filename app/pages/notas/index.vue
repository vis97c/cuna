<template>
	<div id="notes" class="view --gap-none">
		<section class="view-item --minHeightVh-100 --bgColor-light">
			<div class="holder flx --flxColumn --flx-center --gap-50">
				<div class="flx --flxColumn --flx-center --gap-30 --width-100">
					<div class="txt --txtAlign-center">
						<h1 class="--txtLineHeight-sm">Notas</h1>
						<p class="">Encuentra notas útiles o comparte una.</p>
						<div class="flx --flxRow --flx-center --gap-20">
							<component
								:is="personal ? XamuActionLink : XamuActionButtonToggle"
								@click="personal = false"
							>
								Explorar
							</component>
							<component
								:is="!personal ? XamuActionLink : XamuActionButtonToggle"
								@click="personal = true"
							>
								Mis notas
							</component>
							<XamuActionButtonToggle
								v-if="USER.canDevelop"
								tooltip="Actualizar"
								tooltip-position="right"
								round
								@click="emittedRefresh"
							>
								<XamuIconFa name="rotate-right" />
								<XamuIconFa name="rotate-right" regular />
							</XamuActionButtonToggle>
						</div>
					</div>
					<XamuModal
						title="Nueva nota"
						:save-button="{ title: 'Publicar nota' }"
						class="--txtColor --txtAlign --txtWeight"
						invert-theme
						@close="close"
						@save="createNote"
					>
						<template #toggle="{ toggleModal }">
							<div class="--width-100 --maxWidth-770">
								<XamuBoxEditor
									v-model="newNoteBody"
									placeholder="Comparte algo que te guste..."
									class="--width-100 --flx"
								>
									<template #submit>
										<span
											v-if="newNoteBody.length"
											:class="{
												'--txtColor-danger': remainingCharacters < 0,
											}"
											style="order: -1"
										>
											{{ remainingCharacters }}
										</span>
										<XamuActionButtonToggle
											:disabled="!newNoteBody"
											tag="label"
											for="new-note-public"
										>
											<XamuInputToggle
												id="new-note-public"
												v-model="newNotePublic"
												:size="eSizes.XS"
												:label="newNotePublic ? 'Publico' : 'Privado'"
											/>
										</XamuActionButtonToggle>
										<XamuActionButton
											:disabled="!newNoteBody"
											tooltip="Publicar nota"
											tooltip-position="bottom"
											round
											@click="() => toggleModal(true)"
										>
											<span class="--hidden:md-inv">Publicar</span>
											<XamuIconFa name="paper-plane" />
										</XamuActionButton>
									</template>
								</XamuBoxEditor>
							</div>
						</template>
						<template #default="{ model, invertedTheme }">
							<XamuForm
								v-if="model"
								v-model="noteInputs"
								v-model:invalid="invalidNote"
								:theme="invertedTheme"
							/>
						</template>
					</XamuModal>
				</div>
				<ClientOnly>
					<template #fallback>Cargando notas...</template>
					<XamuPaginationContent
						v-slot="{ content }"
						:page="notesPage"
						url="api:instance:notes"
						:defaults="{ page: true, personal }"
						no-content-message="No hay notas disponibles, puedes crear una."
						label="Cargando notas..."
						class="flx --flxColumn --flx-start-center --maxWidth-770 --width-100 --gap-50"
						hide-controls="single"
						with-route
						client
						@refresh="emittedRefresh = $event"
						@has-content="hasContent"
					>
						<ItemNote
							v-for="(note, noteIndex) in content"
							:key="note.id ?? noteIndex"
							:note="note"
							:hydrate-node="makeHydrateNode(noteIndex)"
							:refresh="emittedRefresh"
							class="--width-100"
						/>
					</XamuPaginationContent>
				</ClientOnly>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
	import {
		collectionGroup,
		query,
		where,
		getDocs,
		doc,
		type DocumentReference,
		type Query,
	} from "firebase/firestore";

	import type {
		iGetPage,
		iInvalidInput,
		iNodeFnResponseStream,
		iPage,
		tFormInput,
	} from "@open-xamu-co/ui-common-types";
	import { eSizes } from "@open-xamu-co/ui-common-enums";

	import type {
		Note,
		NoteRef,
		NoteValues,
		NoteVoteRef,
		ExtendedInstanceMemberRef,
	} from "~/utils/types";

	import { XamuActionButtonToggle, XamuActionLink } from "#components";

	type HydrateNodes = (newContent: Note[] | null, newErrors?: unknown) => void;

	/**
	 * Note page
	 *
	 * @page
	 */

	definePageMeta({
		title: "Notas",
		middleware: ["enabled", "auth-only"],
	});

	const { getResponse } = useFormInput();
	const Swal = useSwal();
	const CUNA = useCunaStore();
	const USER = useUserStore();
	const { $clientFirestore } = useNuxtApp();

	// Form refs
	const invalidNote = ref<iInvalidInput[]>([]);
	const noteInputs = ref<tFormInput[]>(useNoteInputs());
	const newNoteBody = ref<string>("");
	const newNotePublic = ref<boolean>(true);

	// Content refs
	const emittedRefresh = ref<() => void>();
	const emittedContent = ref<Note[] | null>();
	const emittedHasContent = ref<boolean>();
	const emittedHydrateNodes = ref<HydrateNodes>();
	const deactivated = ref<boolean>(false);

	/** Personal notes only */
	const personal = ref<boolean>(false);

	const remainingCharacters = computed(() => {
		const limit = CUNA.config?.notesCharactersLimit ?? 4096;

		return limit - newNoteBody.value.length;
	});

	const notesPage: iGetPage<Note> = (pagination) => {
		return useQuery<iPage<Note> | undefined>("/api/instance/notes", {
			method: "POST",
			query: pagination,
			headers: { "Cache-Control": "no-store" },
			cache: "no-store",
		});
	};

	function close() {
		invalidNote.value = [];
		noteInputs.value = useNoteInputs();
	}

	async function createNote(closeModal: () => void, event: Event) {
		const { response, invalidInputs, withErrors, validationHadErrors, errors } =
			await getResponse<iNodeFnResponseStream<Note>[0], NoteValues>(
				async ({ name }) => {
					try {
						// create note
						const [data] = await useDocumentCreate<NoteRef, Note>(
							`${USER.path}/notes`,
							{
								name,
								body: newNoteBody.value.slice(
									0,
									CUNA.config?.notesCharactersLimit ?? 4096
								),
								public: newNotePublic.value,
								keywords: name.trim().split(" "),
							}
						);
						const [createdNote] = Array.isArray(data) ? data : [data];

						if (typeof createdNote !== "object") return { errors: "Missing data" };

						return { data };
					} catch (errors) {
						return { errors };
					}
				},
				noteInputs.value,
				event
			);

		invalidNote.value = invalidInputs;

		const [createdNote, ...stream] = Array.isArray(response) ? response : [response];
		let updatedNodes: Note[] | undefined;

		if (!withErrors && createdNote) {
			// Succesful request
			Swal.fire({
				title: "Nota creada exitosamente",
				text: "Ya puedes encontrarla en las notas",
				icon: "success",
				willOpen() {
					// Add new element at the beginning
					if (typeof createdNote === "object" && createdNote.id) {
						updatedNodes = emittedContent.value?.toSpliced(0, 0, createdNote);

						// Hydration stream, do not await
						Promise.allSettled(
							stream.map(async (next) => {
								const updated = await next;

								// Bypass hydration
								if (!updated || deactivated.value) return;

								if (typeof updated === "object" && updated.id) {
									const nodeIndex = updatedNodes?.findIndex(({ id }) => {
										return id === updated.id;
									});
									const hydrateNode = makeHydrateNode(nodeIndex ?? -1);

									// Hydrate if possible
									hydrateNode({ ...createdNote, ...updated });
								}
							})
						);
					}

					// Prefer hydration over refreshing
					if (emittedHydrateNodes.value && updatedNodes) {
						emittedHydrateNodes.value(updatedNodes);
					} else if (!emittedHydrateNodes.value) emittedRefresh.value?.();

					// Reset form
					newNoteBody.value = "";
					newNotePublic.value = true;
					closeModal?.();
				},
			});
		} else if (!validationHadErrors) {
			Swal.fire({
				title: "¡Algo sucedió!",
				text: "Ocurrió un error mientras creábamos la nota",
				icon: "error",
				target: event,
			});

			useAppLogger("pages:notes:createNote", errors);
		}
	}

	/**
	 * Handles content emission
	 */
	function hasContent(value: boolean, content?: Note[] | null, hydrateNodes?: HydrateNodes) {
		emittedHasContent.value = value;
		emittedContent.value = content;
		emittedHydrateNodes.value = hydrateNodes;
	}

	function makeHydrateNode(nodeIndex: number) {
		return (newNode: Note | null, _newErrors?: unknown) => {
			if (!newNode) return;

			// Replace the node with the updated one
			const existingNode = emittedContent.value?.[nodeIndex];

			if (nodeIndex > -1) {
				const updatedNodes = emittedContent.value?.toSpliced(nodeIndex, 1, {
					...existingNode,
					...newNode,
				});

				// Hydrate node, fallback to refresh
				if (updatedNodes && emittedHydrateNodes.value) {
					emittedHydrateNodes.value(updatedNodes);
				} else if (!emittedHydrateNodes.value) emittedRefresh.value?.();
			}
		};
	}

	// lifecycle
	watch(
		emittedContent,
		async (content = [], oldContent = []) => {
			if (import.meta.server || !$clientFirestore) return;
			// Bypass if same content
			if (!content?.length || content[0]?.updatedAt === oldContent?.[0]?.updatedAt) return;

			// Get votes for the new notes
			const createdByRef: DocumentReference<ExtendedInstanceMemberRef> = doc(
				$clientFirestore,
				USER.path
			);
			const notePaths: string[] = content.map(({ id = "" }) => id);
			const votesRef: Query<NoteVoteRef> = collectionGroup($clientFirestore, "votes");
			// Get own votes for the new notes
			const toQuery = query(
				votesRef,
				where("createdByRef", "==", createdByRef),
				where("notePath", "in", notePaths)
			);
			const votesSnapshot = await getDocs(toQuery);
			// Map votes within notes
			const hydratedNotes: Note[] = content.map((note) => {
				// Match vote with note
				const voteSnapshot = votesSnapshot.docs.find(({ ref }) => {
					return note.id && ref?.path?.startsWith(note.id);
				});
				const { vote = 0 } = voteSnapshot?.data() || {};

				return { ...note, vote };
			});

			// Hydrate nodes
			emittedHydrateNodes.value?.(hydratedNotes);
		},
		{ immediate: true }
	);
	onActivated(() => {
		if (deactivated.value) emittedRefresh.value?.();

		deactivated.value = false;
	});
	onDeactivated(() => {
		deactivated.value = true;
	});
</script>

<style lang="scss">
	@media only screen {
		/**
			Hide pagination size selector
			Likes fetch size depends on this
		*/
		#notes.view li:has(> select#first) {
			display: none;
		}
	}
</style>

<style scoped lang="scss">
	@media only screen {
		.x-editor-span {
			grid-column: 1/ -1;
		}
	}
</style>
