<template>
	<XamuModal
		v-if="value?.schedule?.some((day) => day)"
		class="--txtColor"
		:title="`${value.courseName}. ${value.name}`"
		:save-button="{ title: enrolledMessage }"
		invert-theme
		@save="() => (enrolled = !enrolled)"
	>
		<template #toggle="{ toggleModal, model }">
			<XamuActionButton :active="model" tooltip="Ver horario" round @click="toggleModal()">
				<XamuIconFa name="calendar-week" />
			</XamuActionButton>
		</template>
		<template #default>
			<Week
				:enrolled-groups="enrolled ? SESSION.enrolled : [value, ...SESSION.enrolled]"
				:highlight="!enrolled ? value.courseCode : ''"
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

	const props = defineProps<{ value: Group }>();

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
	const enrolledMessage = computed(() => {
		if (!SESSION.token) return ""; // Require session
		if (enrolled.value) return "Quitar del horario";
		if (SESSION.enrolled.some(({ id }) => id === props.value.id)) {
			return "Reemplazar grupo";
		}

		return "Añadir al horario";
	});
</script>
