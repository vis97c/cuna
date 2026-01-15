<template>
	<XamuActionButtonToggle
		v-if="props.value.schedule?.some((day) => day)"
		:key="props.value.name"
		:theme="enrolled ? eColors.SUCCESS : eColors.SECONDARY"
		:tooltip="enrolled ? 'Quitar del horario' : 'Añadir al horario'"
		:active="enrolled"
		round
		@click="enrolled = !enrolled"
	>
		<XamuIconFa name="question" />
		<XamuIconFa name="check" />
	</XamuActionButtonToggle>
	<span v-else>-</span>
</template>
<script setup lang="ts">
	import { eColors } from "@open-xamu-co/ui-common-enums";

	import type { EnrolledGroup } from "~~/functions/src/types/entities";

	/**
	 * Enroll group
	 *
	 * @component
	 */

	const props = defineProps<{
		value: EnrolledGroup;
	}>();

	const USER = useUserStore();

	const enrolled = computed({
		get() {
			const { courseCode, name } = props.value;

			return USER.enrolled[courseCode]?.name === name;
		},
		set(enroll) {
			if (enroll) return USER.enroll(props.value);

			USER.unenroll(props.value.courseCode);
		},
	});
</script>
