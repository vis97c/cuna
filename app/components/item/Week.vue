<template>
	<XamuBaseBox
		:theme="theme"
		:el="XamuBaseAction"
		class="x-class --flx-center --flx --p-5 --gap-5 --txtSize-xs"
		:disabled="highlight"
		:to="`/cursos/${getCourseId(group)}`"
		:tooltip="title"
		button
	>
		<span class="--txtWrap --txtWeight --txtAlign-center" :title="group.courseName">
			{{ getCourseName(group.courseName) }}
		</span>
		<span class="--txtAlign-center" :title="group.name">
			{{ getGroupName(group.name) }}
		</span>
	</XamuBaseBox>
</template>

<script setup lang="ts">
	import { eThemeColors } from "@open-xamu-co/ui-common-enums";

	import type { Group } from "~/utils/types";

	import { XamuBaseAction } from "#components";

	defineOptions({ name: "ItemWeek" });

	defineProps<{
		group: Group;
		highlight?: boolean;
		duration: number;
		theme: eThemeColors;
		title: string;
	}>();

	function getCourseId(group: Group) {
		const [, , , courseId] = group.id?.split("/") || [];

		return courseId;
	}

	function getCourseName(courseName?: string) {
		const name = (courseName || "").replaceAll(".", "");

		if (name.length > 20) return name.slice(0, 20) + "..";

		return name;
	}

	function getGroupName(name?: string) {
		const [shortName] = name?.split("-") || [];

		return shortName.trim();
	}
</script>

<style lang="scss" scoped>
	@media only screen {
		@layer presets {
			.x-class {
				border-radius: 0.5rem;
			}
		}
	}
</style>
