<template>
	<XamuDropdown v-if="SESSION.token" :position="['bottom', 'right']" invert-theme>
		<template #toggle="{ setModel, model }">
			<li>
				<XamuActionLink
					aria-label="Ver opciones de usuario"
					tooltip="Ver opciones de usuario"
					tooltip-as-text
					tooltip-position="bottom"
					:active="model"
					:size="eSizes.LG"
					@click="setModel()"
				>
					<span class="--hidden:sm-inv">
						{{ SESSION.userName || "Sin nombre" }}
					</span>
					<figure v-if="SESSION.user?.photoURL" class="avatar --size-sm --bdr">
						<XamuBaseImg
							:src="SESSION.user.photoURL"
							:alt="`Foto de perfil ${SESSION.userName || 'Sin nombre'}`"
						/>
					</figure>
					<XamuIconFa indicator name="chevron-down" />
				</XamuActionLink>
			</li>
		</template>
		<template #default="{ setModel }">
			<nav class="list flx --flxColumn --gap-20 --minWidth-max --txtColor">
				<ul class="list-group --gap-5">
					<li>
						<p class="--txtSize-xs">
							Cuenta ⋅
							{{ SESSION.user?.email }}
						</p>
					</li>
					<li>
						<XamuActionLink to="/cuenta">
							<XamuIconFa name="circle-user" />
							<span>Mi perfil</span>
						</XamuActionLink>
					</li>
					<hr />
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
					<hr />
					<li>
						<XamuActionButton
							class="--width-100"
							:theme="eColors.DANGER"
							@click="
								setModel(false);
								SESSION.logout();
							"
						>
							<XamuIconFa name="power-off" />
							<span>Cerrar sesion</span>
						</XamuActionButton>
					</li>
				</ul>
			</nav>
		</template>
	</XamuDropdown>
</template>

<script setup lang="ts">
	import { eColors, eSizes } from "@open-xamu-co/ui-common-enums";

	import { eSIALevel } from "~/functions/src/types/SIA";

	const SESSION = useSessionStore();

	const { levels, places } = useCourseProgramOptions([eSIALevel.PREGRADO, SESSION.place], true);

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
