<template>
	<XamuActionButtonToggle
		v-if="props.value?.schedule?.some((day) => day)"
		:key="props.value.name"
		:theme="enrolled ? eColors.SUCCESS : eColors.SECONDARY"
		:tooltip="enrolled ? 'Quitar del horario' : 'Añadir al horario'"
		:active="enrolled"
		round
		@click="() => (enrolled = !enrolled)"
	>
		<XamuIconFa name="question" />
		<XamuIconFa name="check" />
	</XamuActionButtonToggle>
	<span v-else>-</span>
</template>
<script setup lang="ts">
	import { eColors } from "@open-xamu-co/ui-common-enums";

	import type { Group } from "~/utils/types";

	/**
	 * Enroll group
	 *
	 * @component
	 */

	const props = defineProps<{
		value: Group;
	}>();

	const USER = useUserStore();

	const enrolled = computed({
		get() {
			return USER.enrolled.some(({ id }) => id === props.value.id);
		},
		set(enroll) {
			if (!props.value) return;

			if (enroll) return USER.enroll(props.value);

			USER.unenroll(props.value);
		},
	});
</script>
