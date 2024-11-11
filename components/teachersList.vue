<template>
	<div class="flx --flxRow --flx-start-center --gap-5">
		<div v-if="props.value.length" class="flx --flxRow --flx-start-center --gap-5">
			<div class="--txtWrap-nowrap">
				<b class="--txtColor-estudiantes">{{ props.value.length }}</b>
				⋅
			</div>
			<template v-for="(childValue, childValueIndex) in props.value" :key="childValueIndex">
				<TeacherItem :teacher="childValue" />
				<span v-if="childValueIndex < props.value.length - 1">⋅</span>
			</template>
		</div>
		<span v-else>-</span>
	</div>
</template>
<script setup lang="ts">
	/**
	 * Teachers list
	 *
	 * @component
	 */

	defineOptions({ name: "ValueComplex", inheritAttrs: false });

	const props = defineProps<{
		value: string[];
	}>();
</script>
