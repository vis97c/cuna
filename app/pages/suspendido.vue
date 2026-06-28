<template>
	<div id="suspended" class="view">
		<section class="view-item --minHeightVh-100 --bgColor-none">
			<div class="holder">
				<div class="flx --flxColumn --flx-center --gap-30">
					<div class="txt --txtAlign-center --gap-20">
						<div>
							<h1>Acceso suspendido</h1>
							<h3>Tu cuenta se encuentra suspendida.</h3>
							<p v-if="banDate" class="--txtColor-danger">
								La suspensión finalizará el: {{ banDate }}
							</p>
							<p v-else class="--txtColor-danger">La suspensión es permanente.</p>
						</div>
					</div>
					<div class="flx --flxRow --flx-center --gap-20">
						<XamuActionButton
							:theme="[eColors.LIGHT, eColors.DARK]"
							@click="SESSION.logout"
						>
							<XamuIconFa name="arrow-right-from-bracket" />
							<span>Cerrar sesión</span>
						</XamuActionButton>
					</div>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
	import { computed } from "vue";

	import type { tThemeTuple, tProp, tThemeModifier } from "@open-xamu-co/ui-common-types";
	import { eColors } from "@open-xamu-co/ui-common-enums";

	/**
	 * Suspended page
	 *
	 * @page
	 */

	definePageMeta({
		title: "Suspendido",
		layout: "none",
		noindex: true,
	});
	defineProps<{ theme: tThemeTuple | tProp<tThemeModifier> }>();

	const SESSION = useSessionStore();

	const banDate = computed(() => {
		const bannedUntil = SESSION.member?.bannedUntilAt;

		if (!bannedUntil) return "";

		const date = new Date(bannedUntil);

		// Format to local date and time string
		return date.toLocaleString("es-CO", {
			dateStyle: "long",
			timeStyle: "short",
		});
	});
</script>
