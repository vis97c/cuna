<template>
	<div id="notes" class="view --gap-none">
		<section class="view-item --minHeightVh-100 --bgColor-light">
			<div class="holder flx --flxColumn --flx-center --gap-50">
				<PaginationNotes :personal="personal">
					<div class="txt --txtAlign-center">
						<h1 class="--txtLineHeight-sm">Notas</h1>
						<p v-if="SESSION.token" class="">Encuentra notas útiles o comparte una.</p>
						<p v-else class="">
							Encuentra notas útiles o regístrate para compartir una.
						</p>
						<div v-if="SESSION.token" class="flx --flxRow --flx-center --gap-20">
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
						</div>
					</div>
				</PaginationNotes>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
	import { XamuActionButtonToggle, XamuActionLink } from "#components";

	/**
	 * Note page
	 *
	 * @page
	 */

	definePageMeta({
		title: "Notas",
		description:
			"Encuentra apuntes, tips, consejos u otros recursos para tus estudios. O comparte los tuyos y ayuda a tus compañeros.",
		middleware: ["enabled"],
	});

	const SESSION = useSessionStore();

	/** Personal notes only */
	const personal = ref<boolean>(false);
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
