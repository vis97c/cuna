<template>
	<XamuActionButtonToggle
		v-if="props.node?.schedule?.some((day) => day)"
		:key="props.node.name"
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
		value: any;
		node?: Group;
	}>();

	const USER = useUserStore();

	const enrolled = computed({
		get() {
			return USER.enrolled.some(({ id }) => id === props.node?.id);
		},
		set(enroll) {
			if (!props.node) return;

			if (enroll) return USER.enroll(props.node);

			USER.unenroll(props.node);
		},
	});
</script>
