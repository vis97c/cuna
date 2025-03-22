<template>
	<XamuDropdown
		v-if="SESSION.token && SESSION.canAdmin"
		:position="['bottom', 'right']"
		invert-theme
	>
		<template #toggle="{ setModel, model }">
			<li>
				<XamuActionLink
					tooltip="Panel de control"
					tooltip-as-text
					tooltip-position="bottom"
					@click="setModel()"
				>
					<XamuActionButtonToggle :active="model" round>
						<XamuIconFa name="star-of-life" />
						<XamuIconFa name="star-of-life" regular />
					</XamuActionButtonToggle>
					<XamuIconFa indicator name="chevron-down" />
				</XamuActionLink>
			</li>
		</template>
		<template #default="{ invertedTheme }">
			<nav
				v-if="SESSION.canDevelop || SESSION.token"
				class="list flx --flxColumn --gap-20 --minWidth-180 --maxWidth-100 --txtColor"
			>
				<ul v-if="SESSION.canDevelop" class="list-group --gap-5">
					<li>
						<p class="--txtSize-xs">Cuna</p>
					</li>
					<li>
						<XamuActionLink :theme="invertedTheme" to="/administrar">
							<XamuIconFa name="star-of-life" />
							<span>Panel de control</span>
						</XamuActionLink>
					</li>
					<hr />
					<li>
						<p class="--txtSize-xs">Administrar</p>
					</li>
					<li>
						<XamuActionLink :theme="invertedTheme" to="/administrar/registros">
							<XamuIconFa name="clock-rotate-left" />
							<span>Registros</span>
						</XamuActionLink>
					</li>
					<li>
						<XamuActionLink :theme="invertedTheme" to="/administrar/cursos">
							<XamuIconFa name="book" />
							<span>Cursos</span>
						</XamuActionLink>
					</li>
					<li>
						<XamuActionLink :theme="invertedTheme" to="/administrar/ajustes">
							<XamuIconFa name="cog" />
							<span>Ajustes</span>
						</XamuActionLink>
					</li>
					<hr />
					<li>
						<XamuActionLink :theme="invertedTheme" @click="toggleLoadedClass">
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
	const SESSION = useSessionStore();

	function toggleLoadedClass() {
		document.body.classList.remove("is--loaded");

		setTimeout(() => {
			document.body.classList.add("is--loaded");
		}, 3000);
	}
</script>
