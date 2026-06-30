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
			:url="urlKey"
			:map-node="mapBuyer"
			:defaults="{ page: true, level: 1, name: filterByMemberName, roles }"
			:create-node="createMember"
			:swal="{
				createdTitle: 'Usuario creado exitosamente',
				createdText: 'Ya puede loguearse',
				notCreatedText: 'Ocurrio un error mientras registrabamos los datos',
			}"
			:table-props="{
				deleteNode: useDocumentDelete,
				updateNode: SESSION.canAdmin ? updateMember : undefined,
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
			:no-content-message="
				filterByMemberName
					? 'Ningún miembro coincide con el filtro.'
					: 'Parece que no hay miembros disponibles en este momento. Puede tratarse de un error.'
			"
			client
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
				<XamuInputText
					v-model="filterByMemberName"
					icon="filter"
					placeholder="Filtrar por nombre..."
					class="--width-90 --width-220:sm"
				/>
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
	import type {
		iGetPage,
		iNodeFnResponse,
		iPage,
		iPagination,
	} from "@open-xamu-co/ui-common-types";
	import { eColors } from "@open-xamu-co/ui-common-enums";

	import type { Member, Resolve } from "~/utils/types";

	import { ValueCellphone, ValueID, ValueLocation } from "#components";
	import { eMemberRole } from "~~/functions/src/types/entities";

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
	const SESSION = useSessionStore();
	const route = useRoute();

	// Create & update user
	const createResolve = ref<Resolve<Member, []>>();
	const updateResolve = ref<Resolve<Member>>();

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

	/**
	 * Filter by member name
	 * @get Get the member name from the route query
	 * @set Set the member name in the route query
	 */
	const filterByMemberName = computed<string>({
		get: () => route.query.name?.toString()?.replaceAll("+", " ") || "",
		set: (value) => {
			return navigateTo({ query: { ...route.query, name: value.replaceAll(" ", "+") } });
		},
	});

	/** Deduplicate asyncData payloads */
	const urlKey = computed(() => {
		let key = "api:instance:members";

		if (guest.value) {
			key += `?guest=${1}`;

			if (filterByMemberName.value) {
				key += `&name=${filterByMemberName.value}`;
			}
		} else if (filterByMemberName.value) {
			key += `?name=${filterByMemberName.value}`;
		}

		return key;
	});

	/**
	 * Roles to manage
	 */
	const roles = computed(() => {
		if (guest.value) return [eMemberRole.GUEST];

		const accept = [eMemberRole.ADMIN, eMemberRole.EDITOR, eMemberRole.MODERATOR];

		if (SESSION.canDevelop) accept.push(eMemberRole.DEVELOPER);

		return accept;
	});

	const membersPage: iGetPage<Member> = (
		pagination?: iPagination & { name?: string },
		signal?: AbortSignal
	) => {
		// filter only if name has 3 or more characters
		if (pagination?.name && pagination.name.length < 3) {
			delete pagination.name;
		}

		return customFetch<iPage<Member> | undefined>("/api/admin/instance/members", {
			method: "POST",
			query: pagination,
			signal,
			credentials: "omit",
			headers: { "Cache-Control": "no-store" },
			cache: "no-store",
		});
	};

	// Member, node methods
	function createMember() {
		return new Promise<undefined | boolean | iNodeFnResponse<Member>>((resolve) => {
			// save resolve, so the promise can be resolved later
			createResolve.value = [resolve];
		});
	}
	function updateMember(member: Member) {
		const role = member?.role ?? 3;
		const sessionRole = SESSION.member?.role ?? 3;

		// Prevent updating users with higher or equal role
		if (role <= sessionRole) {
			Swal.fire({
				title: "No se puede modificar",
				text: "No tienes permiso de modificar este usuario",
				icon: "warning",
			});

			return;
		}

		return new Promise<undefined | boolean | iNodeFnResponse<Member>>((resolve) => {
			// save resolve, so the promise can be resolved later
			updateResolve.value = [resolve, member];
		});
	}

	function mapBuyer(node: Member) {
		return {
			...useMapMember(node),
			role: node.role,
			location: true,
			cellphone: true,
			document: true,
		};
	}
</script>
