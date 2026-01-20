<template>
	<XamuModal
		v-if="node?.schedule?.some((day) => day)"
		class="--txtColor"
		:title="`${node.courseName}. ${node.name}`"
		:save-button="{ title: enrolledMessage }"
		invert-theme
		@save="() => (enrolled = !enrolled)"
	>
		<template #toggle="{ toggleModal, model }">
			<XamuActionButton tooltip="Ver horario" :active="model" @click="toggleModal()">
				<XamuIconFa name="calendar-week" />
			</XamuActionButton>
		</template>
		<template #default>
			<Week
				:enrolled-groups="enrolled ? USER.enrolled : [node, ...USER.enrolled]"
				:highlight="!enrolled ? node.courseCode : ''"
			/>
		</template>
	</XamuModal>
	<span v-else>-</span>
</template>
<script setup lang="ts">
	import { Week } from "#components";

	import type { Group } from "~/utils/types";

	/**
	 * Week group
	 *
	 * @component
	 */

	const props = defineProps<{ value: any; node?: Group }>();

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
	const enrolledMessage = computed(() => {
		if (enrolled.value) return "Quitar del horario";
		if (USER.enrolled.some(({ id }) => id === props.node?.id)) {
			return "Reemplazar grupo";
		}

		return "Añadir al horario";
	});
</script>
