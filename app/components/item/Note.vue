<template>
	<XamuBaseBox
		:to="`/notas/${note.slug}`"
		:el="XamuBaseAction"
		class="x-note txt --txtAlign-left --txtWeight --txtWrap --flx-between --width-100 --flx"
		button
	>
		<div class="flx --flxColumn --flx-start">
			<div class="flx --flxColumn --flx-start --gap-5">
				<p v-if="note?.createdAt" class="--txtSize-sm">
					Creada {{ useTimeAgo(new Date(note.createdAt)) }}
				</p>
				<h3 class="--txtLineHeight-sm">{{ note.name }}</h3>
			</div>
		</div>
		<ul v-if="note.keywords?.length" class="flx --flxRow-wrap --flx-start --gap-5">
			<li v-for="(keyword, keywordIndex) in note.keywords" :key="keywordIndex">
				<XamuActionButtonToggle class="--txtSize-sm" :size="eSizes.XS">
					{{ keyword }}
				</XamuActionButtonToggle>
			</li>
		</ul>
	</XamuBaseBox>
</template>

<script setup lang="ts">
	import { eSizes } from "@open-xamu-co/ui-common-enums";

	import type { Note } from "~/utils/types";

	import { XamuBaseAction } from "#components";

	/**
	 * Item de note
	 *
	 * @item
	 * @example
	 * <ItemNote ></ItemNote>
	 */

	defineOptions({ name: "ItemNote" });
	defineProps<{
		/**
		 * Note data
		 */
		note: Note;
	}>();
</script>

<style scoped lang="scss">
	@media only screen {
		@layer presets {
			.x-note {
				// Square like, but more pleasing to the eye
				aspect-ratio: 20/21;
			}
		}
	}
</style>
