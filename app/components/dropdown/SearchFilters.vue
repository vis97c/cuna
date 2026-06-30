<template>
	<nav class="dropdown-item list flx --flxColumn --gap-20 --minWidth-max --txtColor">
		<ul class="list-group --gap-5">
			<li>
				<p class="--txtSize-xs">Buscador</p>
			</li>
			<li>
				<XamuSelect v-model="selectedLevel" :options="levels" class="--txtAlign-center" />
			</li>
			<li>
				<XamuSelect v-model="selectedPlace" :options="places" class="--txtAlign-center" />
			</li>
			<li class="flx --flxColumn --flx-start --gap-5">
				<XamuInputToggle v-model="withNonRegular" label="Incluir cupos PAES y PEAMA" />
				<p class="--txtSize-xs --maxWidth-220">
					Si perteneces a los programas de admisión
					<a
						href="https://pregrado.unal.edu.co/paes"
						title="Programa de admisión especial"
						target="_blank"
					>
						PAES
					</a>
					o
					<a
						href="https://pregrado.unal.edu.co/peama"
						title="Programa de admisión especial y movilidad académica"
						target="_blank"
					>
						PEAMA,
					</a>
					habilita esta opción para que Cuna te muestre los grupos (Según disponibilidad)
					con cupos exclusivos para estos programas.
				</p>
			</li>
		</ul>
	</nav>
</template>

<script setup lang="ts">
	import type { tProp, tThemeModifier, tThemeTuple } from "@open-xamu-co/ui-common-types";

	import { eSIALevel } from "~~/functions/src/types/SIA";

	/**
	 * Partial Search filters dropdown
	 */

	defineProps<{ theme?: tThemeTuple | tProp<tThemeModifier> }>();
	defineOptions({ name: "DropdownSearchFilters" });

	const SESSION = useSessionStore();

	const { levels, places } = useCourseProgramOptions([eSIALevel.PREGRADO, SESSION.place], {
		noUndef: true,
	});

	const withNonRegular = computed({
		get: () => SESSION.withNonRegular,
		set: (value) => {
			SESSION.toggleNonRegular(value);
		},
	});
	const selectedLevel = computed({
		get: () => SESSION.level,
		set: (value) => {
			SESSION.setLevel(value);
		},
	});
	const selectedPlace = computed({
		get: () => SESSION.place,
		set: (value) => {
			SESSION.setPlace(value);
		},
	});
</script>
