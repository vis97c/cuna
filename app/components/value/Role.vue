<template>
	<XamuActionButtonToggle class="--txtSize-sm" :theme="theme" :size="eSizes.SM">
		{{ useRoleName(node?.role ?? value) }}
	</XamuActionButtonToggle>
</template>

<script setup lang="ts">
	import type { tThemeModifier } from "@open-xamu-co/ui-common-types";
	import { eColors, eSizes } from "@open-xamu-co/ui-common-enums";

	import { eMemberRole } from "~~/functions/src/types/entities";

	/**
	 * Value role
	 *
	 * @component
	 */
	defineOptions({ name: "ValueRole", inheritAttrs: false });

	const props = defineProps<{ node?: { role?: number }; value: number }>();

	const theme = computed<tThemeModifier>(() => {
		switch (props.node?.role ?? props.value) {
			case eMemberRole.DEVELOPER:
				return eColors.DARK;
			case eMemberRole.ADMIN:
				return eColors.DANGER;
			case eMemberRole.EDITOR:
				return eColors.PRIMARY;
			case eMemberRole.MODERATOR:
				return eColors.SUCCESS;
			default:
				return eColors.SECONDARY;
		}
	});
</script>
