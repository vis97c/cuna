<template>
	<XamuActionButtonToggle
		v-if="node.requestedDeletionAt"
		tooltip="Este miembro solicito eliminar su cuenta"
		class="--txtSize-sm"
		:theme="eColors.DANGER"
		:size="eSizes.SM"
		@click="() => deleteNodeAndRefresh(node)"
	>
		Por eliminar
	</XamuActionButtonToggle>
	<XamuActionButtonToggle
		v-else
		class="--txtSize-sm"
		:theme="[eColors.LIGHT, eColors.DARK]"
		:size="eSizes.SM"
		disabled
	>
		Sin solicitud
	</XamuActionButtonToggle>
</template>

<script setup lang="ts">
	import { eColors, eSizes } from "@open-xamu-co/ui-common-enums";
	import type { iNodeFn } from "@open-xamu-co/ui-common-types";

	import type { Member } from "~/utils/types";

	/**
	 * Value deletion
	 *
	 * @component
	 */
	defineOptions({ name: "ValueDeletion", inheritAttrs: false });
	defineProps<{
		node: Member;
		value: any;
		deleteNodeAndRefresh: iNodeFn<Member, [Member, ((m?: boolean) => any)?, HTMLElement?]>;
	}>();
</script>
