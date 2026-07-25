<template>
	<div class="flx --flxColumn --flx-center --gap-30 --width-100">
		<slot
			v-bind="{
				refreshData: emittedRefresh,
				content: emittedContent,
				hasContent: emittedHasContent,
			}"
		></slot>
		<XamuModal
			id="new-note"
			title="Nueva nota"
			:save-button="{
				title: !SESSION.token ? 'Ingresar a Cuna' : 'Publicar nota',
			}"
			class="--txtColor --txtAlign --minWidth-480:md --maxWidth-720:md"
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
								v-if="SESSION.token && !linkedNote?.slug"
								:active="newNotePublic"
								:disabled="!newNoteBody"
							>
								<XamuInputToggle
									v-model="newNotePublic"
									:size="eSizes.XS"
									label="Público"
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
				<template v-if="model">
					<div v-if="!SESSION.token" class="txt --gap-5">
						<p>¡Espera un momento!</p>
						<h3>Debes iniciar sesión para crear una nota</h3>
					</div>
					<XamuForm
						v-else
						v-model="noteInputs"
						v-model:invalid="invalidNote"
						:payload="[linkedNote]"
						:make="makeNoteInputs"
						:theme="invertedTheme"
					/>
				</template>
			</template>
		</XamuModal>
	</div>
	<XamuPaginationContent
		v-slot="{ content }"
		:page="notesPage"
		:url="urlKey"
		:defaults="{
			page: true,
			level: 1,
			omit: ['instance'],
			personal: SESSION.token && personal,
			linkedNoteSlug: linkedNote?.slug,
		}"
		no-content-message="No hay notas disponibles, puedes crear una."
		label="Cargando notas..."
		class="x-notes flx --flxColumn --flx-start-center --maxWidth-770 --width-100 --gap-50"
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
</template>

<script setup lang="ts">
	import { doc, type DocumentReference, getDoc } from "firebase/firestore";

	import type { iGetPage, iInvalidInput, iPage, tFormInput } from "@open-xamu-co/ui-common-types";
	import { eSizes } from "@open-xamu-co/ui-common-enums";

	import type {
		HydrateNodes,
		Note,
		NoteInput,
		NoteValues,
		NoteVoteRef,
	} from "~/utils/types/index.ts";
	import type { NoteData } from "~~/functions/src/types/entities/index.ts";

	/**
	 * Notes pagination
	 *
	 * @component
	 */

	defineOptions({ name: "PaginationNotes", inheritAttrs: false });

	const props = defineProps<{
		personal?: boolean;
		linkedNote?: Note;
	}>();

	const INSTANCE = useInstanceStore();
	const SESSION = useSessionStore();
	const { getResponse } = useFormInput();
	const Swal = useSwal();
	const { $clientFirestore } = useNuxtApp();

	// Form refs
	const invalidNote = ref<iInvalidInput[]>([]);
	const noteInputs = ref<tFormInput[]>([]);
	const newNoteBody = ref<string>("");
	const newNotePublic = ref<boolean>(true);

	// Content refs
	const emittedRefresh = ref<() => void>();
	const emittedContent = ref<Note[] | null>();
	const emittedHasContent = ref<boolean>();
	const emittedHydrateNodes = ref<HydrateNodes<Note>>();
	const deactivated = ref<boolean>(false);

	/** Deduplicate asyncData payloads */
	const urlKey = computed(() => {
		let key = "api:instance:notes";

		if (props.personal) {
			key += `?personal=${SESSION.id}`;
		} else if (props.linkedNote) {
			key += `?linkedNote=${props.linkedNote.slug}`;
		}

		return key;
	});

	const remainingCharacters = computed(() => {
		const limit = INSTANCE.config?.notesCharactersLimit ?? 4096;

		return limit - newNoteBody.value.length;
	});

	const notesPage: iGetPage<Note> = (pagination) => {
		return customFetch<iPage<Note> | undefined>("/api/instance/notes", {
			query: pagination,
			method: "POST",
			credentials: "omit",
			headers: { "Cache-Control": "no-store" },
			cache: "no-store",
		});
	};

	function close() {
		invalidNote.value = [];
		noteInputs.value = [];
	}
	function makeNoteInputs(linkedNote?: Note) {
		const inputs = useNoteInputs({ linkedNote });

		return inputs;
	}

	async function createNote(closeModal: () => void, event: Event) {
		if (!SESSION.token) {
			closeModal();

			return navigateTo({
				path: "/ingresar",
				query: { restricted: encodeURI("/notas"), rdr: "create-note" },
			});
		}

		const { response, invalidInputs, withErrors, validationHadErrors, errors } =
			await getResponse<{ id?: string }, NoteValues>(
				async ({ name }) => {
					try {
						const newNoteInputData: NoteInput = {
							name,
							body: newNoteBody.value.slice(
								0,
								INSTANCE.config?.notesCharactersLimit ?? 4096
							),
							public: !!props.linkedNote?.slug || newNotePublic.value,
							keywords: name.trim().split(" "),
						};

						if (!$clientFirestore) throw Error("Missing firestore");

						// If linked note is provided, add it to the new note
						// TODO: notify when someone links your notes
						if (props.linkedNote?.id) {
							newNoteInputData.linkedNoteRef = doc(
								$clientFirestore,
								props.linkedNote.id
							);
						}

						// create note
						const [data] = await useDocumentCreate<NoteData>(
							`${SESSION.path}/notes`,
							newNoteInputData
						);

						if (typeof data !== "object") return { errors: "Missing data" };

						return { data };
					} catch (errors) {
						return { errors };
					}
				},
				noteInputs.value,
				event
			);

		invalidNote.value = invalidInputs;

		let updatedNodes: Note[] | undefined;

		if (!withErrors && response) {
			// Succesful request
			Swal.fire({
				title: "Nota creada exitosamente",
				text: "Ya puedes encontrarla en las notas",
				icon: "success",
				willOpen() {
					// Add new element at the beginning
					if (typeof response === "object" && response.id) {
						updatedNodes = emittedContent.value?.toSpliced(0, 0, response);
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
	function hasContent(
		value: boolean,
		content?: Note[] | null,
		hydrateNodes?: HydrateNodes<Note>
	) {
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
		[emittedContent, () => SESSION.path],
		async ([content = [], userPath], [oldContent = []]) => {
			if (import.meta.server || !$clientFirestore) return;
			// Bypass if same content
			if (
				!userPath ||
				!content?.length ||
				content[0]?.updatedAt === oldContent?.[0]?.updatedAt
			) {
				return;
			}

			// Map votes within notes
			const hydratedNotes: Note[] = await Promise.all(
				content.map(async (note) => {
					// Get note vote
					const id = `${note.id}/votes/${getDocumentId(userPath)}`;
					const voteRef: DocumentReference<NoteVoteRef> = doc($clientFirestore, id);
					const voteSnapshot = await getDoc(voteRef);
					const { vote = 0 } = voteSnapshot?.data() || {};

					return { ...note, vote };
				})
			);

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
		.x-notes.view li:has(> select#first) {
			display: none;
		}
	}
</style>
