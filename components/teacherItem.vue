<template>
	<XamuActionLink
		v-if="!unassigned && teacherData.losEstudiantesSlug"
		:theme="'estudiantes' as any"
		tooltip="Ver en los estudiantes"
		:href="`${losEstudiantesProfessors}/${teacherData.losEstudiantesSlug}?from=cuna`"
	>
		<XamuIconFa name="hand-fist" />
		<span class="">{{ teacherData.name }}</span>
	</XamuActionLink>
	<p v-else class="">{{ teacherData.name }}</p>
</template>
<script setup lang="ts">
	import { deburr } from "lodash-es";

	import type { Teacher } from "~/resources/types/entities";

	/**
	 * Teachers list
	 *
	 * @component
	 */

	defineOptions({ name: "ValueComplex", inheritAttrs: false });

	const props = defineProps<{
		teacher: string | Teacher;
	}>();

	const APP = useAppStore();
	const { losEstudiantesUrl = "", losEstudiantesProfessorsPath = "" } =
		APP.instance?.config || {};
	const losEstudiantesProfessors = `${losEstudiantesUrl}${losEstudiantesProfessorsPath}`;

	const teacherData = computed<Teacher>(() => {
		if (typeof props.teacher == "string") return { name: props.teacher };

		return props.teacher;
	});
	const unassigned = computed(() => {
		const clean = deburr(teacherData.value.name?.toLowerCase() || "");

		return clean.includes("informado") || clean.includes("docente");
	});
</script>
