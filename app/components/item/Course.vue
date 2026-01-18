<template>
	<XamuBaseBox
		:el="XamuBaseAction"
		class="grd-item txt --txtAlign-left --txtSize-sm --gap-5"
		title="Ver detalles del curso"
		:disabled="!course.indexed"
		:to="`/cursos/${getDocumentId(course.id)}`"
		button
	>
		<p class="--maxWidth-220 ellipsis">{{ course.name }}</p>
		<div class="txt --txtSize-xs --txtWrap --txtWeight-regular --gap-0 --flx">
			<p>
				<b title="Codigo">{{ course.code }}</b>
				⋅
				<span title="Creditos">{{ useTCredits(course.credits) }}</span>
				⋅
				<span v-if="course.scrapedAt" title="Cupos disponibles">
					{{ useTSpot(course.spotsCount) }}
				</span>
				<span v-else title="Cupos disponibles">Abrir para obtener los cupos</span>
			</p>
			<p v-if="course.programs?.length" title="Programas">
				{{ course.programs.join(", ") }}.
			</p>
			<p v-if="course.typologies?.length" title="Tipologías">
				{{ course.typologies.join(", ") }}.
			</p>
		</div>
		<div v-if="course.indexed" class="flx --flxRow --flx-end-center --width-100">
			<XamuIconFa name="arrow-right" />
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
