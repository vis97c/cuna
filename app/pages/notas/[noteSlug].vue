<!-- eslint-disable vue/no-v-html -->
<template>
	<div id="notes-entry" class="view --gap-none --width-100 --minHeight-100">
		<section class="view-item --minHeightVh-100 --bgColor-light">
			<ClientOnly>
				<template #fallback>Cargando nota...</template>
				<XamuLoaderContent
					:loading="pending"
					:content="!pending"
					label="Cargando nota..."
					class="holder flx --flxColumn --flx-center"
				>
					<XamuActionLink v-if="USER.user" to="/notas">
						<XamuIconFa name="chevron-left" :size="10" />
						<span>Volver a las notas</span>
					</XamuActionLink>
					<div class="flx --flxColumn --flx-start --txtAlign-center">
						<p v-if="note?.createdAt && note?.updatedAt" class="--txtSize-sm">
							Creada {{ useTimeAgo(new Date(note.createdAt)) }} ⋅ Actualizada
							{{ useTimeAgo(new Date(note.updatedAt)) }}
						</p>
						<h1 class="x-note-title --txtLineHeight-sm --mBottom-5">
							{{ note?.name }}
						</h1>
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
					<article
						v-if="note?.body"
						class="x-note-text flx --flxColumn --flx-center --gap-30"
					>
						<p class="--txtSize-xs --txtColor-dark5"><i>~ Inicio de la nota ~</i></p>
						<div class="--width-100"><hr /></div>
						<div
							class="x-note-body txt --maxWidth-100"
							v-html="useMarkdown(note.body)"
						></div>
						<div class="--width-100"><hr /></div>
						<p class="--txtSize-xs --txtColor-dark5"><i>~ Fin de la nota ~</i></p>
					</article>
					<span v-else>Esta nota ya no esta disponible</span>
				</XamuLoaderContent>
			</ClientOnly>
		</section>
	</div>
</template>

<script setup lang="ts">
	import { eSizes } from "@open-xamu-co/ui-common-enums";

	import type { Note } from "~/utils/types";

	/**
	 * Note page
	 *
	 * @page
	 */

	definePageMeta({ middleware: ["enabled", "auth-only"] });

	const USER = useUserStore();
	const route = useRoute();
	const { cache } = useRuntimeConfig().public;

	const noteSlug = computed(() => {
		return route.params.noteSlug ? route.params.noteSlug : "";
	});

	const {
		data: note,
		pending,
		error,
	} = useCsrfFetch<Note>(`/api/instance/notes/${noteSlug.value}`, {
		method: "POST",
		headers: { "Cache-Control": cache.frequent },
		server: false,
	});

	// lifecycle
	watch(
		[note, error],
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

<style lang="scss">
	@media only screen {
		@layer presets {
			.x-note-text {
				max-width: min(100%, 66ch);
			}
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
			}
		}
	}
</style>
