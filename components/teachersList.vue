<template>
	<div class="flx --flxRow --flx-start-center --gap-5">
		<div v-if="props.value.length" class="flx --flxRow --flx-start-center --gap-5">
			<div class="--txtWrap-nowrap">
				<b class="--txtColor-estudiantes">{{ props.value.length }}</b>
				⋅
			</div>
			<template v-for="(childValue, childValueIndex) in props.value" :key="childValueIndex">
				<XamuActionLink
					v-if="!unassigned(childValue)"
					:theme="'estudiantes' as any"
					tooltip="Ver en los estudiantes"
					:href="`${losEstudiantesProfessors}/${kebabCase(childValue)}`"
				>
					<XamuIconFa name="hand-fist" />
					<XamuValue v-bind="{ value: childValue, modalProps: props.modalProps }" />
				</XamuActionLink>
				<XamuValue v-else v-bind="{ value: childValue, modalProps: props.modalProps }" />
				<span v-if="childValueIndex < props.value.length - 1">⋅</span>
			</template>
		</div>
		<span v-else>-</span>
	</div>
</template>
<script setup lang="ts">
	import { deburr, kebabCase } from "lodash-es";

	/**
	 * Teachers list
	 *
	 * @component
	 */

	defineOptions({ name: "ValueComplex", inheritAttrs: false });

	const props = defineProps<{
		value: string[];
		modalProps?: Record<string, any>;
	}>();

	const APP = useAppStore();
	const { losEstudiantesUrl = "", losEstudiantesProfessorsPath = "" } =
		APP.instance?.config || {};
	const losEstudiantesProfessors = `${losEstudiantesUrl}${losEstudiantesProfessorsPath}`;

	function unassigned(name = ""): boolean {
		const clean = deburr(name.toLowerCase());

		return clean.includes("informado") || clean.includes("docente");
	}
</script>
