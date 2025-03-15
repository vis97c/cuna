<template>
	<XamuModal
		v-if="value.schedule?.some((day) => day)"
		class="--txtColor"
		:title="`${value.courseName}. ${value.name}`"
		invert-theme
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
	import type { EnrolledGroup } from "~/resources/types/entities";

	import { Week } from "#components";

	/**
	 * Week group
	 *
	 * @component
	 */

	defineProps<{
		value: EnrolledGroup;
	}>();

	const SESSION = useSessionStore();

	const enrolledGroups = computed(() => Object.values(SESSION.enrolled));
</script>
