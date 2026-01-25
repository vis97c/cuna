<template>
	<XamuDropdown
		:position="['bottom', 'right']"
		classes="flx --flxColumn --flx-start-stretch --gap-10:md"
		invert-theme
	>
		<template #toggle="toggleScope">
			<slot v-bind="toggleScope"></slot>
		</template>
		<template v-if="USER.token && USER.canDevelop" #default="{ invertedTheme, setModel }">
			<nav
				class="dropdown-item list flx --flxColumn --gap-20 --minWidth-180 --maxWidth-100 --txtColor"
			>
				<ul class="list-group --gap-5">
					<li>
						<p class="--txtSize-xs">Cuna ⋅ {{ getDocumentId(INSTANCE.current?.id) }}</p>
					</li>
					<li>
						<XamuActionLink :theme="invertedTheme" to="/administrar">
							<XamuIconFa name="star-of-life" />
							<span>Panel de control</span>
						</XamuActionLink>
					</li>
					<li>
						<XamuActionLink :theme="invertedTheme" to="/administrar/cursos">
							<XamuIconFa name="book" />
							<span>Cursos</span>
						</XamuActionLink>
					</li>
				</ul>
			</nav>
			<nav
				class="dropdown-item list flx --flxColumn --gap-20 --minWidth-220 --minWidth-180:md --maxWidth-100 --txtColor"
			>
				<ul class="list-group">
					<li>
						<p class="--txtSize-xs">Administrar</p>
					</li>
					<li>
						<XamuActionLink :theme="invertedTheme" to="/administrar/instancias">
							<XamuIconFa name="at" />
							<span>Instancias</span>
						</XamuActionLink>
					</li>
					<li>
						<XamuActionLink :theme="invertedTheme" to="/administrar/usuarios">
							<XamuIconFa name="users" />
							<span>Usuarios</span>
						</XamuActionLink>
					</li>
					<li>
						<XamuActionLink :theme="invertedTheme" to="/administrar/registros">
							<XamuIconFa name="clock-rotate-left" />
							<span>Registros</span>
						</XamuActionLink>
					</li>
					<hr />
					<li>
						<XamuActionLink :theme="invertedTheme" to="/administrar/ajustes">
							<XamuIconFa name="cog" />
							<span>Ajustes</span>
						</XamuActionLink>
					</li>
				</ul>
			</nav>
			<nav
				class="dropdown-item list flx --flxColumn --gap-20 --minWidth-220 --minWidth-180:md --maxWidth-100 --txtColor"
			>
				<ul class="list-group">
					<li>
						<p class="--txtSize-xs">Desarrollo</p>
					</li>
					<li>
						<XamuActionLink :theme="invertedTheme" @click="clearInstance">
							<XamuIconFa name="trash-can" />
							<span>Clear instance</span>
						</XamuActionLink>
					</li>
					<li>
						<XamuActionLink
							:theme="invertedTheme"
							@click="() => toggleLoadedClass(setModel)"
						>
							<XamuIconFa name="flag-checkered" />
							<span>Toggle loaded class</span>
						</XamuActionLink>
					</li>
				</ul>
			</nav>
		</template>
	</XamuDropdown>
</template>

<script setup lang="ts">
	import debounce from "lodash-es/debounce";

	import type { tProp, tThemeModifier, tThemeTuple } from "@open-xamu-co/ui-common-types";
	import { getDocumentId } from "@open-xamu-co/firebase-nuxt/client/resolver";

	/**
	 * Admin dropdown
	 */

	defineProps<{ theme?: tThemeTuple | tProp<tThemeModifier> }>();
	defineOptions({ name: "DropdownAdminInstance" });

	const USER = useUserStore();
	const INSTANCE = useInstanceStore();

	const toggleLoadedClass = debounce(function (toggleModal?: (v?: boolean) => void) {
		toggleModal?.(false);
		document.body.classList.remove("is--loaded");

		setTimeout(() => {
			document.body.classList.add("is--loaded");
		}, 3000);
	});
	const clearInstance = debounce(async function () {
		// Remove cache
		await useCsrfQuery("/api/instance", { method: "DELETE" });

		INSTANCE.unsetInstance();
		location.reload();
	});
</script>
