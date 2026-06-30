<template>
	<XamuModal
		v-if="node?.image"
		title="Imagen"
		:subtitle="node?.name"
		class="--txtColor --txtAlign --minWidth-480:md --maxWidth-720:md"
		:class="$attrs.class"
		target="body"
		:theme="[eColors.LIGHT, eColors.DARK]"
		invert-theme
	>
		<template #toggle="{ toggleModal }">
			<XamuActionLink tooltip="Ver imagen" tooltip-position="bottom" @click="toggleModal">
				<figure class="avatar --size-sm">
					<XamuBaseImg
						preset="avatar"
						class="--bgColor-none"
						:src="value"
						:alt="node?.name"
						placeholder="/sample-loading.png"
						@error="onImageError"
					/>
				</figure>
			</XamuActionLink>
		</template>
		<template #default="{ model }">
			<div v-if="model" class="--width-480 --maxWidth-100">
				<XamuBaseImg
					class="--width-100 --bgColor-none"
					:src="useImagePath(node?.image, 'medium')"
					:alt="node?.name"
					placeholder="/sample-loading.png"
					@error="onImageError"
				/>
			</div>
		</template>
	</XamuModal>
	<span v-else>-</span>
</template>

<script setup lang="ts">
	import { eColors } from "@open-xamu-co/ui-common-enums";

	/**
	 * Value Image
	 *
	 * @component
	 */
	defineOptions({ name: "ValueImage", inheritAttrs: false });
	defineProps<{ value: string; node?: { name?: string; image?: string } }>();
</script>
