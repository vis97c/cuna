<template>
	<section id="admin-registry" class="flx --flxColumn --gap-30">
		<div class="txt">
			<div class="">
				<h2>Registros</h2>
				<p class="--txtSize-lg:md">
					Supervisa los registros
					{{ global ? "globales" : `de ${appName}` }}
				</p>
			</div>
		</div>
		<XamuPaginationContentTable
			:key="global ? 'global' : 'instance'"
			:page="global ? logsPage : instanceLogsPage"
			url="api:instance:all:logs"
			:map-node="useMapLog"
			:defaults="{ page: true, level: 1 }"
			:table-props="{
				deleteNode: useDocumentDelete,
				properties: [
					{ value: 'createdBy', alias: 'Creado por' },
					{ value: 'lock', hidden: true },
				],
				modalProps: {
					invertTheme: true,
					class: '--txtColor',
				},
			}"
			label="Cargando registros..."
			no-content-message="No hay registros disponibles"
		>
			<template #headActions="{ refreshData }">
				<template v-if="USER.canDevelop">
					<XamuActionButtonToggle
						:tooltip="`${!global ? 'Mostrar' : 'Ocultar'} registros globales`"
						:active="global"
						round=":md-inv"
						@click="global = !global"
					>
						<XamuIconFa name="globe" />
						<XamuIconFa name="globe" />
						<span class="--hidden-full:md-inv">Global</span>
					</XamuActionButtonToggle>
					<XamuInputText
						v-model="emulatedLogCount"
						:min="CUNA.tabletMQRange ? '1' : 1"
						type="number"
						class="--width-90 --width-180:md"
					/>
					<XamuActionButton
						:theme="eColors.PRIMARY"
						@click="addEmulatedLogs(refreshData)"
					>
						<XamuIconFa name="clock-rotate-left" />
						<span class="--hidden:lg-inv">Emular registros</span>
						<XamuIconFa class="--hidden:lg" name="plus" />
					</XamuActionButton>
				</template>
				<XamuActionButtonToggle
					tooltip="Actualizar"
					tooltip-position="right"
					round
					@click="refreshData"
				>
					<XamuIconFa name="rotate-right" />
					<XamuIconFa name="rotate-right" regular />
				</XamuActionButtonToggle>
			</template>
		</XamuPaginationContentTable>
	</section>
</template>

<script setup lang="ts">
	import type { iGetPage, iPage } from "@open-xamu-co/ui-common-types";
	import type { InstanceLog, InstanceLogRef } from "@open-xamu-co/firebase-nuxt/client";
	import { eColors } from "@open-xamu-co/ui-common-enums";

	/**
	 * Admin/Developer logs page
	 *
	 * @page
	 */
	definePageMeta({ title: "Registros", middleware: ["can-admin"] });

	const CUNA = useCunaStore();
	const USER = useUserStore();
	const INSTANCE = useInstanceStore();
	const Swal = useSwal();
	const { cache, appName } = useRuntimeConfig().public;
	const route = useRoute();

	const emulatedLogCount = ref(1);

	/** Get global logs */
	const global = computed({
		get: () => !!route.query.global,
		set: (value) => {
			// Update query, reset pagination
			navigateTo({
				path: route.path,
				query: { global: value ? "1" : undefined },
			});
		},
	});

	const logsPage: iGetPage<InstanceLog> = (pagination) => {
		return useQuery<iPage<InstanceLog> | undefined>("/api/all/logs", {
			query: pagination,
			headers: { "Cache-Control": cache.none },
		});
	};
	const instanceLogsPage: iGetPage<InstanceLog> = (pagination) => {
		return useQuery<iPage<InstanceLog> | undefined>("/api/instance/all/logs", {
			query: pagination,
			headers: { "Cache-Control": cache.none },
		});
	};

	async function addEmulatedLogs(willOpen: () => void) {
		Swal.fireLoader({
			title: "Emulando registros...",
			text: "Por favor no cierres esta ventana",
		});

		try {
			const arr = Array.from({ length: emulatedLogCount.value }, (_, index) => index + 1);
			const logsCollectionPath = global.value ? "logs" : `${INSTANCE.id}/logs`;

			// Run sequentially
			for (const index of arr) {
				await useDocumentCreate<InstanceLogRef>(logsCollectionPath, {
					at: "administrar:registros:addEmulatedLogs",
					message: `Registro emulado #${index} de ${emulatedLogCount.value}`,
					code: "test",
				});
			}

			Swal.fire({
				icon: "success",
				title: "Registros emulados",
				text: `Se han emulado ${emulatedLogCount.value} registros`,
				willOpen, // Refresh logs
			});
		} catch (err) {
			// Couldn't create logs
			useAppLogger("administrar:registros:addEmulatedLogs", "error", err);

			Swal.fire({
				icon: "error",
				title: "Algo salió mal",
				text: "No se pudieron crear los registros",
			});
		}
	}
</script>
