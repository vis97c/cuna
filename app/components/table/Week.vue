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
			<XamuActionButton tooltip="Ver horario" :active="model" @click="toggleModal()">
				<XamuIconFa name="calendar-week" />
			</XamuActionButton>
		</template>
		<template #default>
			<Week
				:enrolled-groups="enrolled ? USER.enrolled : [value, ...USER.enrolled]"
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
	const enrolledMessage = computed(() => {
		if (!USER.token) return ""; // Require session
		if (enrolled.value) return "Quitar del horario";
		if (USER.enrolled.some(({ id }) => id === props.value.id)) {
			return "Reemplazar grupo";
		}

		return "Añadir al horario";
	});
</script>
