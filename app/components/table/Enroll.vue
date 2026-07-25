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

	import type { Group } from "~/utils/types/index.ts";

	/**
	 * Enroll group
	 *
	 * @component
	 */

	const props = defineProps<{
		value: Group;
	}>();

	const SESSION = useSessionStore();

	const enrolled = computed({
		get() {
			return SESSION.enrolled.some(({ id }) => id === props.value.id);
		},
		set(enroll) {
			if (!props.value) return;

			if (enroll) return SESSION.enroll(props.value);

			SESSION.unenroll(props.value);
		},
	});
</script>
