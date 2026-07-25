<template>
	<XamuDropdown
		:position="['bottom', 'right']"
		classes="flx --flxColumn --flx-start-stretch --gap-10:md"
		invert-theme
	>
		<template #toggle="toggleScope">
			<slot v-bind="toggleScope"></slot>
		</template>
		<template #default="{ invertedTheme, setModel }">
			<nav
				v-if="SESSION.token"
				class="dropdown-item list flx --flxColumn --gap-20 --minWidth-max --txtColor"
			>
				<ul class="list-group --gap-5">
					<li>
						<p class="--txtSize-xs">
							Cuenta ⋅
							{{ email }}
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
			<DropdownSearchFilters />
		</template>
	</XamuDropdown>
</template>

<script setup lang="ts">
	import debounce from "lodash-es/debounce";

	import type { tProp, tThemeModifier, tThemeTuple } from "@open-xamu-co/ui-common-types";
	import { eColors } from "@open-xamu-co/ui-common-enums";

	/**
	 * Member dropdown
	 */

	defineProps<{ theme?: tThemeTuple | tProp<tThemeModifier> }>();
	defineOptions({ name: "DropdownMember" });

	const SESSION = useSessionStore();
	const { $clientAuth } = useNuxtApp();

	const email = computed(() => $clientAuth?.currentUser?.email);

	/**
	 * Logout and close modal
	 */
	const logout = debounce(function (toggleModal?: (v?: boolean) => void) {
		toggleModal?.(false);
		SESSION.logout();
	});
</script>
