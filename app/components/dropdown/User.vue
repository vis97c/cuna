<template>
	<XamuDropdown
		:position="['bottom', 'right']"
		classes="flx --flxColumn --flx-start-stretch --gap-10:md"
		invert-theme
	>
		<template #toggle="toggleScope">
			<slot v-bind="toggleScope"></slot>
		</template>
		<template v-if="USER.token" #default="{ invertedTheme, setModel }">
			<nav class="dropdown-item list flx --flxColumn --gap-20 --minWidth-max --txtColor">
				<ul class="list-group --gap-5">
					<li>
						<p class="--txtSize-xs">
							Cuenta ⋅
							{{ USER.user?.email }}
						</p>
					</li>
					<li>
						<XamuActionLink :theme="invertedTheme" to="/cuenta">
							<XamuIconFa name="circle-user" />
							<span>Mi perfil</span>
						</XamuActionLink>
					</li>
					<hr />
					<li>
						<XamuActionLink
							class="--width-100"
							:theme="[eColors.DANGER, invertedTheme[1]]"
							@click="() => logout(setModel)"
						>
							<XamuIconFa name="power-off" />
							<span>Cerrar sesion</span>
						</XamuActionLink>
					</li>
				</ul>
			</nav>
			<nav class="dropdown-item list flx --flxColumn --gap-20 --minWidth-max --txtColor">
				<ul class="list-group --gap-5">
					<li>
						<p class="--txtSize-xs">Buscador</p>
					</li>
					<li>
						<XamuSelect
							v-model="selectedLevel"
							:options="levels"
							class="--txtAlign-center"
						/>
					</li>
					<li>
						<XamuSelect
							v-model="selectedPlace"
							:options="places"
							class="--txtAlign-center"
						/>
					</li>
					<li class="flx --flxColumn --flx-start --gap-5">
						<XamuInputToggle
							v-model="withNonRegular"
							label="Incluir cupos PAES y PEAMA"
						/>
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
							habilita esta opción para que Cuna te muestre los grupos (Según
							disponibilidad) con cupos exclusivos para estos programas.
						</p>
					</li>
				</ul>
			</nav>
		</template>
	</XamuDropdown>
</template>

<script setup lang="ts">
	import { debounce } from "lodash-es";

	import type { tProp, tThemeModifier, tThemeTuple } from "@open-xamu-co/ui-common-types";
	import { eColors } from "@open-xamu-co/ui-common-enums";

	import { eSIALevel } from "~~/functions/src/types/SIA";

	/**
	 * User dropdown
	 */

	defineProps<{ theme?: tThemeTuple | tProp<tThemeModifier> }>();
	defineOptions({ name: "DropdownUser" });

	const USER = useUserStore();

	const { levels, places } = useCourseProgramOptions([eSIALevel.PREGRADO, USER.place], true);

	const withNonRegular = computed({
		get: () => USER.withNonRegular,
		set: (value) => {
			USER.toggleNonRegular(value);
		},
	});
	const selectedLevel = computed({
		get: () => USER.level,
		set: (value) => {
			USER.setLevel(value);
		},
	});
	const selectedPlace = computed({
		get: () => USER.place,
		set: (value) => {
			USER.setPlace(value);
		},
	});

	/**
	 * Logout and close modal
	 */
	const logout = debounce(function (toggleModal?: (v?: boolean) => void) {
		toggleModal?.(false);
		USER.logout();
	});
</script>
