<template>
	<XamuDropdown :position="['bottom', 'right']" invert-theme>
		<template #toggle="toggleSlots">
			<slot v-bind="toggleSlots"></slot>
		</template>
		<template #default>
			<div class="flx --flxColumn --flx-start --gap-10 --txtColor">
				<div class="txt --gap-5">
					<p class="--txtSize-xs">Cursos inscritos</p>
					<h4>Mi horario académico</h4>
				</div>
				<div class="--pX-5 --width-100">
					<hr />
				</div>
				<Week :enrolled-groups="Object.values(USER.enrolled)" />
			</div>
		</template>
	</XamuDropdown>
</template>

<script setup lang="ts">
	defineProps<{ enrolledCount: number }>();

	const USER = useUserStore();
</script>
