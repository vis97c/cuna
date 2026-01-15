<template>
	<XamuDropdown :position="['bottom', 'right']" invert-theme>
		<template #toggle="toggleScope">
			<slot v-bind="toggleScope"></slot>
		</template>
		<template #default="{ invertedTheme }">
			<nav class="list flx --flxColumn --gap-20 --width-220 --maxWidth-100 --txtColor">
				<ul class="list-group">
					<li class="flx --flxRow --flx-between-center">
						<p class="--txtSize-xs --txtTransform-upper">Mis tareas</p>
						<XamuActionButtonToggle
							:theme="invertedTheme"
							:size="eSizes.SM"
							@click="CUNA.clearQueue()"
						>
							Limpiar
						</XamuActionButtonToggle>
					</li>
					<li v-for="item in CUNA.queue" :key="item.id" class="box --pX-10 --pY-5">
						<div class="txt --gap-5 --width-220">
							<div>
								<p class="--txtSize-xs">{{ item.id }}</p>
								<p>
									<b>{{ item.message }}</b>
								</p>
							</div>
							<p v-if="item.completed" class="--txtSize-sm">Tarea completada</p>
							<p v-else class="--txtSize-sm">Tarea pendiente</p>
						</div>
					</li>
				</ul>
			</nav>
		</template>
	</XamuDropdown>
</template>

<script setup lang="ts">
	import type { tProp, tThemeModifier, tThemeTuple } from "@open-xamu-co/ui-common-types";
	import { eSizes } from "@open-xamu-co/ui-common-enums";

	/**
	 * Queue dropdown
	 */

	defineProps<{ theme?: tThemeTuple | tProp<tThemeModifier> }>();
	defineOptions({ name: "DropdownQueue" });

	const CUNA = useCunaStore();
</script>
