<template>
	<XamuBaseBox
		:el="XamuBaseAction"
		class="x-course grd-item flx --flxColumn --flx-between-stretch --gap-5 --txtSize-sm --p"
		title="Ver detalles del curso"
		:to="`/cursos/${getDocumentId(course.id)}`"
		button
	>
		<p class="--txtWrap --txtAlign-left" :title="course.name">{{ course.name }}.</p>
		<div class="flx --flxColumn --flx-start-stretch --gap-5">
			<div
				class="txt --txtSize-xs --txtWrap --txtWeight-regular --txtAlign-left --gap-5 --flx"
			>
				<p>
					<b title="Codigo">{{ course.code }}</b>
					⋅
					<span title="Creditos">{{ useTCredits(course.credits) }}</span>
					⋅
					<span v-if="course.spotsCount ?? false" title="Cupos disponibles">
						{{ useTSpot(course.spotsCount) }}
					</span>
					<span v-else title="Cupos disponibles">?? cupos</span>
				</p>
				<p v-if="course.faculties?.length" title="Facultades">
					{{ course.faculties.join(", ") }}.
				</p>
				<p v-if="course.typologies?.length" title="Tipologías">
					{{ course.typologies.join(", ") }}.
				</p>
			</div>
			<div class="flx --flxRow --flx-end-center --width-100">
				<XamuIconFa name="arrow-right" />
			</div>
		</div>
	</XamuBaseBox>
</template>
<script setup lang="ts">
	import { getDocumentId } from "@open-xamu-co/firebase-nuxt/client/resolver";

	import type { Course } from "~/utils/types";

	import { XamuBaseAction } from "#components";

	/**
	 * Course item
	 *
	 * @component <CourseItem />
	 */

	defineProps<{ course: Course }>();
</script>

<style scoped lang="scss">
	@media only screen {
		@layer presets {
			.x-course {
				// Square like, but more pleasing to the eye
				aspect-ratio: 3/2;
			}
		}
	}
</style>
