<template>
	<div id="landing" class="view">
		<section class="view-item --minHeightVh-100 --bgColor-light">
			<div class="holder flx --flxColumn --flx-center">
				<div class="txt --txtAlign-center --txtColor-dark5 --gap-5">
					<h1 class="--txtLineHeight-sm">
						<XamuActionLink to="/" class="no--override no--route --gap">
							<span class="--txtLineHeight-sm">cuna</span>
							<XamuIconFa name="chess-knight" :size="10" />
						</XamuActionLink>
					</h1>
					<div class="flx --flxRow --flx-center --gap-10">
						<p>Visor de cursos UNAL</p>
						<XamuActionLink
							class="x-info"
							:theme="eColors.DARK"
							tooltip="Cuna no esta afiliada a la UNAL"
							tooltip-as-text
						>
							<XamuIconFa name="circle-info" />
						</XamuActionLink>
					</div>
					<div class="flx --flxRow --flx-center --gap-10 --txtSize-xs">
						<XamuActionLink
							href="https://github.com/vis97c/cuna"
							tooltip="Código fuente. GNU GPL v3"
						>
							<XamuIconFa name="github" brand />
						</XamuActionLink>
						<span v-if="CUNA.config?.version">
							{{ CUNA.config.version }} Powered by
							<a href="https://xamu.com.co" target="_blank">Xamu.</a>
						</span>
					</div>
				</div>
				<div v-if="CUNA.SIAMaintenance" class="txt --txtAlign-center --gap-10">
					<h4>El SIA se encuentra en mantenimiento</h4>
					<p class="--txtSize-sm --txtColor-dark5">
						Puedes explorar los cursos previamente guardados, pero el buscador estará
						inactivo y los cursos no se actualizarán hasta que el mantenimiento termine.
					</p>
					<p
						class="--txtSize-xs --txtColor-dark5"
						:title="CUNA.config?.siaMaintenanceTillAt?.toString()"
					>
						Volveremos a la normalidad {{ SIAMaintenanceTillAt }}.
					</p>
				</div>
				<div
					v-else-if="CUNA.ExplorerV1Maintenance || CUNA.ExplorerV2Maintenance"
					class="txt --txtAlign-center --gap-10"
				>
					<h4>El buscador se encuentra en mantenimiento</h4>
					<p class="--txtSize-sm --txtColor-dark5">
						Puedes explorar los cursos previamente guardados.
					</p>
					<p v-if="CUNA.ExplorerV1Maintenance" class="--txtSize-xs --txtColor-dark5">
						Volveremos a la normalidad
						{{ ExplorerV1MaintenanceTillAt }}.
					</p>
					<p v-else class="--txtSize-xs --txtColor-dark5">
						Volveremos a la normalidad
						{{ ExplorerV2MaintenanceTillAt }}.
					</p>
				</div>
				<div
					v-else-if="!USER.token && route.path != '/ingresar'"
					class="txt --txtAlign-center --gap-10"
				>
					<h4>Modo lectura</h4>
					<p class="--txtSize-sm --txtColor-dark5">
						Inicia sesión para obtener una experiencia completa con búsqueda de cursos e
						información de cupos actualizada, así como otras novedades.
					</p>
				</div>
				<SearchCourse />
				<div v-if="USER.token" class="flx --flxColumn --flx-center --width-100">
					<div class="txt">
						<h3 class="--txtColor-dark5">Otros recursos</h3>
					</div>
					<ul class="x-items flx --flxRow --flx-center">
						<li>
							<XamuBoxAction
								:theme="calculadoraTheme"
								to="https://calc-unal.vercel.app?from=cuna.com.co"
								icon="calculator"
								label="Calculadora de PAPPI"
								target="_blank"
							/>
						</li>
						<li>
							<XamuBoxAction
								:theme="estudiantesTheme"
								to="https://losestudiantes.com/universidad-nacional?from=cuna.com.co"
								icon="hand-fist"
								label="Los estudiantes"
								target="_blank"
							/>
						</li>
					</ul>
				</div>
				<div class="txt --txtAlign-center --txtSize-xs --txtColor-dark5 --minWidth-100">
					<div v-if="USER.token" class="">
						<p>
							Visita cada pagina de curso para obtener los cupos en tiempo real
							(Antiguo SIA).
						</p>
						<p>
							Usamos el explorador de cursos para listar los cursos, de momento este
							no algunos cursos como los de libre elección.
						</p>
					</div>
					<p>No dudes en reportar cualquier problema o sugerencia a nuestro instagram.</p>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
	import { eColors } from "@open-xamu-co/ui-common-enums";

	/**
	 * Landing page
	 *
	 * @page
	 */

	definePageMeta({
		path_label: "Buscador",
		title: "Buscador de cursos",
	});

	const CUNA = useCunaStore();
	const USER = useUserStore();
	const route = useRoute();

	const calculadoraTheme = "calculadora" as any;
	const estudiantesTheme = "estudiantes" as any;

	const SIAMaintenanceTillAt = computed(() => {
		const date = new Date(CUNA.config?.siaMaintenanceTillAt || new Date());

		return useTimeAgo(date);
	});
	const ExplorerV1MaintenanceTillAt = computed(() => {
		const date = new Date(CUNA.config?.explorerV1MaintenanceTillAt || new Date());

		return useTimeAgo(date);
	});
	const ExplorerV2MaintenanceTillAt = computed(() => {
		const date = new Date(CUNA.config?.explorerV2MaintenanceTillAt || new Date());

		return useTimeAgo(date);
	});
</script>
