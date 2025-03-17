<template>
	<XamuModal
		v-if="value.schedule?.some((day) => day)"
		class="--txtColor"
		:title="`${value.courseName}. ${value.name}`"
		:save-button="{ title: enrolledMessage }"
		invert-theme
		@save="enrolled = !enrolled"
	>
		<template #toggle="{ toggleModal, model }">
			<XamuActionButton tooltip="Ver horario" :active="model" @click="toggleModal()">
				<XamuIconFa name="calendar-week" />
			</XamuActionButton>
		</template>
		<template #default>
			<Week :enrolled-groups="[value]">
				<div v-if="enrolledGroups.length" class="back --opacity-05">
					<Week :enrolled-groups="enrolledGroups" />
				</div>
			</Week>
		</template>
	</XamuModal>
	<span v-else>-</span>
</template>
<script setup lang="ts">
	import type { EnrolledGroup } from "~/functions/src/types/entities";

	import { Week } from "#components";

	/**
	 * Week group
	 *
	 * @component
	 */

	const props = defineProps<{
		value: EnrolledGroup;
	}>();

	const SESSION = useSessionStore();

	const enrolledGroups = computed(() => Object.values(SESSION.enrolled));
	const enrolled = computed({
		get() {
			const { courseCode, name } = props.value;

			return SESSION.enrolled[courseCode]?.name === name;
		},
		set(enroll) {
			if (enroll) return SESSION.enroll(props.value);

			SESSION.unenroll(props.value.courseCode);
		},
	});
	const enrolledMessage = computed(() => {
		const { courseCode } = props.value;

		if (enrolled.value) return "Quitar del horario";
		if (SESSION.enrolled[courseCode]) return "Reemplazar grupo";

		return "Añadir al horario";
	});
</script>
