<!-- eslint-disable vue/no-v-html -->
<template>
	<XamuModal
		title="Actualizar nota existente"
		:save-button="{ title: 'Actualizar nota' }"
		class="--txtColor --txtAlign --txtWeight"
		target="body"
		invert-theme
		@close="close"
		@save="updateNote"
	>
		<template #toggle="{ toggleModal }">
			<article v-bind="$attrs" class="x-note txt flx --flxColumn --flx-center">
				<p class="--txtSize-xs --txtColor-dark5"><i>~ Inicio de la nota ~</i></p>
				<div class="--width-100"><hr /></div>
				<div class="flx --flxColumn --flx-start --gap-30 --width-100 --p">
					<div class="flx --flxColumn --flx-start">
						<div class="flx --flxColumn --flx-start --gap-5">
							<h2 class="x-note-title">
								<XamuActionLink
									v-if="route.path !== `/notas/${note.slug}`"
									:to="`/notas/${note.slug}`"
									class="--txtLineHeight-1 --txtWrap --txtAlign"
								>
									{{ note.name }}
								</XamuActionLink>
								<span v-else class="--txtLineHeight-1 --txtWrap --txtAlign">
									{{ note.name }}
								</span>
							</h2>
							<p v-if="note?.createdAt && note?.updatedAt" class="--txtSize-sm">
								Creada {{ useTimeAgo(new Date(note.createdAt)) }} ⋅ Actualizada
								{{ useTimeAgo(new Date(note.updatedAt)) }}
							</p>
						</div>
						<ul
							v-if="note?.keywords?.length"
							class="x-note-text flx --flxRow-wrap --flx-start --gap-5"
						>
							<li
								v-for="(keyword, keywordIndex) in note.keywords"
								:key="keywordIndex"
							>
								<XamuActionButtonToggle class="--txtSize-sm" :size="eSizes.XS">
									{{ keyword }}
								</XamuActionButtonToggle>
							</li>
						</ul>
					</div>
					<section
						v-if="note?.body"
						class="x-note-text flx --flxColumn --flx-center --width-100"
					>
						<div
							class="x-note-body txt --width-100"
							v-html="useMarkdown(note.body)"
						></div>
					</section>
					<div class="flx --flxRow --flx-between-center --width-100">
						<div class="x-votes">
							<XamuActionLink tooltip="Votar +1" class="x-vote --up">
								<XamuIconFa name="caret-up" :size="20" />
							</XamuActionLink>
							<span>1</span>
							<XamuActionLink tooltip="Votar -1" class="x-vote --down">
								<XamuIconFa name="caret-down" :size="20" />
							</XamuActionLink>
						</div>
						<XamuActionButton v-if="ownNote" tooltip="Editar nota" @click="toggleModal">
							<XamuIconFa name="pen" />
							<span class="--hidden:sm-inv">Editar</span>
						</XamuActionButton>
					</div>
				</div>
				<div class="--width-100"><hr /></div>
				<p class="--txtSize-xs --txtColor-dark5"><i>~ Fin de la nota ~</i></p>
			</article>
		</template>
		<template #default="{ model, invertedTheme }">
			<div class="--maxWidth-480">
				<XamuForm
					v-if="model"
					v-model="noteInputs"
					v-model:invalid="invalidNote"
					:make="makeNoteInputs"
					:theme="invertedTheme"
				/>
			</div>
		</template>
	</XamuModal>
</template>

<script setup lang="ts">
	import { eSizes } from "@open-xamu-co/ui-common-enums";
	import type {
		iInvalidInput,
		iNodeFnResponseStream,
		tFormInput,
	} from "@open-xamu-co/ui-common-types";

	import type { Note, NoteRef, NoteValues } from "~/utils/types";

	/**
	 * Item de note
	 *
	 * @item
	 * @example
	 * <ItemNote ></ItemNote>
	 */

	defineOptions({ name: "ItemNote", inheritAttrs: false });

	const props = defineProps<{
		/**
		 * Note data
		 */
		note: Note;
		hydrateNode?: (node: Note | null, errors?: unknown) => void;
		refresh?: (...args: any[]) => any;
	}>();

	const USER = useUserStore();
	const { getResponse } = useFormInput();
	const Swal = useSwal();
	const route = useRoute();

	// Form refs
	const invalidNote = ref<iInvalidInput[]>([]);
	const noteInputs = ref<tFormInput[]>([]);
	const deactivated = ref<boolean>(false);

	/**
	 * The note belongs to the current user
	 */
	const ownNote = computed(() => {
		return props.note.id?.startsWith(USER.path);
	});

	function close() {
		invalidNote.value = [];
		noteInputs.value = useNoteInputs();
	}
	function makeNoteInputs() {
		const inputs = useNoteInputs(props.note);

		return inputs;
	}

	/**
	 * Updates existing note
	 */
	async function updateNote(closeModal: (s?: boolean) => void, event: Event) {
		let withSlug = false;
		const expectedNote: Partial<NoteValues> = {
			keywords: (props.note.keywords || []).join?.(", "),
			body: props.note.body,
			public: props.note.public,
			name: props.note.name,
			slug: props.note.slug,
		};

		if (USER.canDevelop) {
			expectedNote.lock = Array.isArray(props.note.lock)
				? !!props.note.lock.length
				: props.note.lock;
		}

		const { response, invalidInputs, withErrors, validationHadErrors, errors } =
			await getResponse<iNodeFnResponseStream<Note>[0], NoteValues>(
				async (values) => {
					try {
						const diffValues = getValuesDiff(values, expectedNote);

						// Prevent updating if values are equal
						if (!diffValues) return { data: undefined };

						const { keywords, ...updatedValues } = diffValues;
						const updatedRef: Partial<NoteRef> = updatedValues;

						if (updatedValues.slug) withSlug = true;
						if (keywords !== undefined) {
							updatedRef.keywords = keywords.split(",").map((k) => k.trim());
						}

						// update note
						const [data] = await useDocumentUpdate<NoteRef, Note>(
							props.note,
							updatedRef
						);
						const [updatedNote] = Array.isArray(data) ? data : [data];

						if (typeof updatedNote !== "object") return { errors: "Missing data" };

						return { data };
					} catch (errors) {
						return { errors };
					}
				},
				noteInputs.value,
				event
			);

		invalidNote.value = invalidInputs;

		const [updatedNote, ...stream] = Array.isArray(response) ? response : [response];

		if (!withErrors && updatedNote) {
			// Succesful request
			Swal.fire({
				title: "Nota actualizada exitosamente",
				text: "Ya puedes ver sus ajustes",
				icon: "success",
				willOpen() {
					// Update existing node. Prefer hydration over refreshing
					if (typeof updatedNote === "object" && updatedNote.id && props.hydrateNode) {
						props.hydrateNode(updatedNote);

						// Hydration stream, do not await
						Promise.all(
							stream.map(async (next) => {
								const updated = await next;

								// Bypass hydration
								if (!updated || deactivated.value) return;
								if (typeof updated === "object" && updated.id) {
									if (withSlug) return navigateTo(`/notas/${updated.slug}`);

									props.hydrateNode?.({ ...updatedNote, ...updated });
								}
							})
						);
					} else if (!props.hydrateNode) props.refresh?.();

					closeModal?.();
				},
			});
		} else if (!validationHadErrors) {
			if (!response && !errors) {
				Swal.fire({
					icon: "warning",
					title: "Sin cambios",
					text: "No puedes actualizar los datos sin realizar algún cambio primero",
					target: event,
				});
			} else {
				// Unknown error
				Swal.fire({
					icon: "error",
					title: "No se pudo actualizar la nota",
					text: "Ocurrió un error inesperado",
					target: event,
				});

				useAppLogger("components:ModalUpdateNote:updateNote", errors);
			}
		}
	}

	// lifecycle
	onActivated(() => {
		if (deactivated.value) props.refresh?.();

		deactivated.value = false;
	});
	onDeactivated(() => {
		deactivated.value = true;
	});
</script>

<style lang="scss">
	@media only screen {
		@layer presets {
			// .x-note-text {
			// 	max-width: min(100%, 66ch);
			// }
			.x-note-body {
				pre:has(code) {
					width: 100%;
					padding: 1rem;
					border-radius: 1rem;
					overflow: auto hidden;
					background: xamu.color(secondary, 0.05);
					border: 2px solid xamu.color(secondary, 0.1);
					color: xamu.color(secondary);
				}
				code {
					span.hljs-comment {
						opacity: 0.7;
					}
					span.hljs-attr {
						font-weight: bold;
					}
				}
				ol,
				ul {
					padding-left: 1.5rem;
				}
				ol {
					li {
						list-style-type: decimal;
					}
				}
				ul {
					li {
						list-style-type: disc;
					}
				}

				a {
					text-decoration: underline;
					z-index: 1;

					&::before {
						content: "Abrir enlace";
						width: max-content;
						display: block;
						overflow: hidden;
						z-index: 15;
						position: absolute;
						opacity: 0;
						white-space: normal;
						bottom: 0;
						left: 50%;
						transform: translate(-50%, calc(100% + 0.4em));

						// vertical-align: bottom;
						color: xamu.color(light);
						padding: 0 0.4rem;
						text-align: center;
						font-size: 0.7rem;
						border-radius: 0.4rem * xamu.strip-unit(xamu.$size-radius);
						font-weight: xamu.weight();
						box-shadow: 3px 3px 9px xamu.color(dark, 0.3);
						box-sizing: content-box;
						border: 2px solid xamu.color(light, 0.1);
						background: xamu.color(dark);
						pointer-events: none;
						text-shadow: none;
					}
					&:hover::before {
						@media (any-pointer: fine) {
							// dektop only
							opacity: 1;
						}
					}
				}

				img {
					border-radius: 1rem;
					box-shadow: 3px 3px 9px xamu.color(secondary, 0.1);
					max-width: 100%;
					object-fit: contain;
				}
			}
		}
	}
</style>

<style lang="scss" scoped>
	@media only screen {
		@layer presets {
			.x-votes {
				width: auto;
				padding: 0;
				border-radius: 1rem;
				background: xamu.color(secondary, 0.1);
				font-weight: xamu.weight(bold);
				vertical-align: middle;
				color: xamu.color(secondary);
				min-height: 2.4rem;

				// Clear all transition
				&:hover {
					transition: none;
				}
			}
			.x-vote {
				&.--up {
					padding: 0.6rem 1rem 0.45rem;
				}
				&.--down {
					padding: 0.45rem 1rem 0.6rem;
				}
			}
		}
	}
</style>
