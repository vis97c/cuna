<template>
	<XamuDropdown v-if="SESSION.user && enrolledCount" :position="['bottom', 'left']" invert-theme>
		<template #toggle="{ setModel, model }">
			<li>
				<XamuActionButtonToggle
					tooltip="Ver mi horario"
					:active="model"
					@click="setModel()"
				>
					<XamuIconFa name="book" />
					<XamuIconFa name="book" />
					<span>{{ enrolledCount }}</span>
				</XamuActionButtonToggle>
			</li>
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
				<Week :enrolled-groups="Object.values(SESSION.enrolled)" />
			</div>
		</template>
	</XamuDropdown>
</template>

<script setup lang="ts">
	const SESSION = useSessionStore();

	const enrolledCount = computed(() => Object.keys(SESSION.enrolled).length);
</script>
