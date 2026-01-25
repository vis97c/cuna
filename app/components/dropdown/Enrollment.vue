<template>
	<XamuDropdown :position="['bottom', 'right']" invert-theme>
		<template #toggle="toggleSlots">
			<slot v-bind="toggleSlots"></slot>
		</template>
		<template #default>
			<div class="flx --flxColumn --flx-start-stretch --gap-10 --txtColor">
				<div class="flx --flxColumn --flx-start-stretch --gap-5">
					<p class="--txtSize-xs">Cursos inscritos</p>
					<div class="flx --flxRow --flx-between-center">
						<h4>Mi horario académico</h4>
						<XamuActionButtonToggle
							tooltip="Limpiar mi horario"
							round
							@click="USER.clearEnrolled"
						>
							<XamuIconFa name="broom" />
							<XamuIconFa name="broom" regular />
						</XamuActionButtonToggle>
					</div>
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
