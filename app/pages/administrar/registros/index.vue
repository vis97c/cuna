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
			:defaults="{ page: true, level: 1, filter }"
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
			@refresh="emittedRefresh = $event"
		>
			<template #headActions="{ refreshData }">
				<XamuModal
					title="Emular nuevo registro"
					:save-button="{ title: 'Emular registro' }"
					class="--txtColor --txtAlign --txtWeight"
					target="body"
					invert-theme
					@save="addEmulatedLogs"
				>
					<template #toggle="{ toggleModal }">
						<XamuActionButton :theme="eColors.PRIMARY" @click="toggleModal">
							<XamuIconFa name="clock-rotate-left" />
							<span class="--hidden:lg-inv">Emular registros</span>
							<XamuIconFa class="--hidden:lg" name="plus" />
						</XamuActionButton>
					</template>
					<XamuInputText
						v-model="emulatedLogCount"
						:min="CUNA.tabletMQRange ? '1' : 1"
						type="number"
					/>
				</XamuModal>
				<XamuActionButtonToggle
					:tooltip="`${!global ? 'Mostrar' : 'Ocultar'} registros globales`"
					:active="global"
					round
					@click="global = !global"
				>
					<XamuIconFa name="globe" />
					<XamuIconFa name="globe" />
				</XamuActionButtonToggle>
				<XamuActionButtonToggle
					tooltip="Actualizar"
					tooltip-position="right"
					round
					@click="refreshData"
				>
					<XamuIconFa name="rotate-right" />
					<XamuIconFa name="rotate-right" regular />
				</XamuActionButtonToggle>
				<XamuInputText
					v-model="filterAt"
					icon="filter"
					placeholder="Omitir registros..."
					class="--width-90 --width-220:md"
				/>
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
	const INSTANCE = useInstanceStore();
	const Swal = useSwal();
	const { appName } = useRuntimeConfig().public;
	const route = useRoute();

	const emittedRefresh = ref<() => void>();
	const emulatedLogCount = ref(1);
	/** Filter out logs by origin */
	const filterAt = ref("");

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
	const filter = computed(() => {
		const arr = filterAt.value.split(",");

		return arr.length ? arr : [];
	});

	const logsPage: iGetPage<InstanceLog> = (pagination) => {
		return useQuery<iPage<InstanceLog> | undefined>("/api/logs", {
			query: pagination,
			headers: { "Cache-Control": "no-store" },
			cache: "no-store",
		});
	};
	const instanceLogsPage: iGetPage<InstanceLog> = (pagination) => {
		return useQuery<iPage<InstanceLog> | undefined>("/api/instance/logs", {
			query: pagination,
			headers: { "Cache-Control": "no-store" },
			cache: "no-store",
		});
	};

	async function addEmulatedLogs(closeModal: (s?: boolean) => void, event: Event) {
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
				willOpen() {
					emittedRefresh.value?.();
					closeModal();
				},
				target: event,
			});
		} catch (err) {
			// Couldn't create logs
			useAppLogger("administrar:registros:addEmulatedLogs", "error", err);

			Swal.fire({
				icon: "error",
				title: "Algo salió mal",
				text: "No se pudieron crear los registros",
				target: event,
			});
		}
	}
</script>
