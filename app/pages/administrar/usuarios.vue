<template>
	<section id="admin-team" class="flx --flxColumn --gap-30">
		<div class="grd --grdColumns-auto2:md --flx-start-center">
			<div class="txt">
				<div class="">
					<h2>Usuarios</h2>
					<p class="--txtSize-lg:md">Supervisa a los usuarios de cuna.</p>
				</div>
				<p>
					Nunca esta de mas una mano amiga. Mantén el control de las capacidades de los
					usuarios.
				</p>
			</div>
			<div class="txt --txtSize-sm --txtColor">
				<h4>Consejos para el usuario:</h4>
				<div>
					<p>*Distintos roles permiten limitar las acciones de cada colaborador.</p>
				</div>
				<div class="--pLeft">
					<p>
						<b>- Administrador:</b>
						Control total, añade usuarios y/o modificar su rol.
					</p>
					<p>
						<b>- Editor:</b>
						Creación y control parcial sobre los contenidos de la tienda.
					</p>
					<p>
						<b>- Moderador:</b>
						Monitoreo de procesos y control de usuarios problemáticos.
					</p>
					<p>
						<b>- Invitado:</b>
						Visitantes del sitio, posibles clientes de tu tienda.
					</p>
				</div>
			</div>
		</div>
		<XamuPaginationContentTable
			:page="membersPage"
			url="api:instance:members"
			:map-node="mapBuyer"
			:defaults="{ page: true, level: 1, guest }"
			:create-node="createMember"
			:swal="{
				createdTitle: 'Usuario creado exitosamente',
				createdText: 'Ya puede loguearse',
				notCreatedText: 'Ocurrio un error mientras registrabamos los datos',
			}"
			:table-props="{
				deleteNode: useDocumentDelete,
				updateNode: USER.canAdmin ? updateMember : undefined,
				properties: [
					{ value: 'locationCountry', hidden: true },
					{ value: 'locationState', hidden: true },
					{ value: 'locationCity', hidden: true },
					{ value: 'cellphoneNumber', hidden: true },
					{ value: 'cellphoneIndicative', hidden: true },
					{ value: 'documentNumber', hidden: true },
					{ value: 'documentType', hidden: true },
					{ value: 'lock', hidden: true },
					{ value: 'cellphone', component: ValueCellphone },
					{ value: 'document', component: ValueID },
					{ value: 'location', component: ValueLocation },
					{ value: 'role', component: useRoleComponent },
				],
				modalProps: {
					invertTheme: true,
					class: '--txtColor',
				},
			}"
			label="Cargando miembros..."
			no-content-message="Parece que no hay miembros disponibles en este momento. Puede tratarse de un error."
		>
			<template #headActions="{ refreshData, createNodeAndRefresh }">
				<XamuActionButton :theme="eColors.PRIMARY" @click="createNodeAndRefresh">
					<XamuIconFa name="user" />
					<span class="--hidden:sm-inv">Añadir usuario</span>
					<XamuIconFa class="--hidden:sm" name="plus" />
				</XamuActionButton>
				<XamuActionButtonToggle
					:tooltip="`${!guest ? 'Mostrar' : 'Ocultar'} invitados`"
					:active="guest"
					round=":sm-inv"
					@click="guest = !guest"
				>
					<XamuIconFa name="user-group" />
					<XamuIconFa name="user-group" />
					<span class="--hidden-full:sm-inv">Invitados</span>
				</XamuActionButtonToggle>
				<XamuActionButtonToggle tooltip="Actualizar" round @click="refreshData">
					<XamuIconFa name="rotate-right" />
					<XamuIconFa name="rotate-right" regular />
				</XamuActionButtonToggle>
			</template>
			<template #default="{ refreshData }">
				<ModalCreateUser v-model="createResolve" :refresh="refreshData" />
				<ModalUpdateMember v-model="updateResolve" :refresh="refreshData" />
			</template>
		</XamuPaginationContentTable>
	</section>
</template>

<script setup lang="ts">
	import type { iGetPage, iNodeFnResponseStream, iPage } from "@open-xamu-co/ui-common-types";
	import type { Resolve } from "@open-xamu-co/firebase-nuxt/client";
	import { eColors } from "@open-xamu-co/ui-common-enums";

	import type { ExtendedInstanceMember } from "~/utils/types";

	import { ValueCellphone, ValueID, ValueLocation } from "#components";

	/**
	 * Admin members page
	 *
	 * @page
	 */
	definePageMeta({
		title: "Usuarios",
		middleware: ["can-admin"],
	});

	const Swal = useSwal();
	const USER = useUserStore();
	const route = useRoute();

	// Create & update user
	const createResolve = ref<Resolve<ExtendedInstanceMember, []>>();
	const updateResolve = ref<Resolve<ExtendedInstanceMember>>();

	/** Show guest users */
	const guest = computed({
		get() {
			return !!route.query.guest;
		},
		set(value) {
			navigateTo({
				path: route.path,
				query: { ...route.query, guest: value ? 1 : undefined },
			});
		},
	});

	const membersPage: iGetPage<ExtendedInstanceMember> = (pagination) => {
		return useQuery<iPage<ExtendedInstanceMember> | undefined>("/api/instance/members", {
			query: pagination,
			credentials: "omit",
			headers: { "Cache-Control": "no-store" },
			cache: "no-store",
		});
	};

	// Member, node methods
	function createMember() {
		return new Promise<undefined | boolean | iNodeFnResponseStream<ExtendedInstanceMember>>(
			(resolve) => {
				// save resolve, so the promise can be resolved later
				createResolve.value = [resolve];
			}
		);
	}
	function updateMember(member: ExtendedInstanceMember) {
		const role = member?.role ?? 3;
		const sessionRole = USER.user?.role ?? 3;

		// Prevent updating users with higher or equal role
		if (role <= sessionRole) {
			Swal.fire({
				title: "No se puede modificar",
				text: "No tienes permiso de modificar este usuario",
				icon: "warning",
			});

			return;
		}

		return new Promise<undefined | boolean | iNodeFnResponseStream<ExtendedInstanceMember>>(
			(resolve) => {
				// save resolve, so the promise can be resolved later
				updateResolve.value = [resolve, member];
			}
		);
	}

	function mapBuyer(node: ExtendedInstanceMember) {
		return {
			...useMapMember(node),
			role: node.role,
			location: true,
			cellphone: true,
			document: true,
		};
	}
</script>
