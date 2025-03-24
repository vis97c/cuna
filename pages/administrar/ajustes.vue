<template>
	<section id="admin-index" class="flx --flxColumn --gap-30">
		<div class="txt">
			<div class="">
				<h2>Ajustes</h2>
				<p>Ajustar los detalles de mi tienda.</p>
			</div>
		</div>
		<div class="flx --flxRow-wrap --flx-start --gap-30">
			<section class="flx --flxColumn --flx-start --flx --minWidth-33">
				<div class="txt --gap-none --maxWidth-440">
					<h3>SEO del sitio</h3>
					<p>
						Esta información es importante para posicionarse en los principales
						buscadores.
					</p>
				</div>
				<div class="--width-100 --maxWidth-440">
					<XamuForm v-model="instanceSEOInputs" v-model:invalid="invalidInstance" />
				</div>
				<XamuActionButton @click="setInstance">
					<span>Actualizar SEO</span>
					<XamuIconFa name="pencil-alt" />
				</XamuActionButton>
			</section>
			<section class="flx --flxColumn --flx-start --flx --minWidth-33">
				<div class="txt --gap-none --maxWidth-440">
					<h3>Banner del sitio:</h3>
					<p>Mensaje opcional para los usuarios.</p>
				</div>
				<div class="--width-100 --maxWidth-440">
					<XamuForm v-model="bannerInputs" v-model:invalid="invalidBanner" />
				</div>
				<XamuActionButton @click="setBanner">
					<span>Actualizar banner</span>
					<XamuIconFa name="pencil-alt" />
				</XamuActionButton>
			</section>
		</div>
	</section>
</template>

<script setup lang="ts">
	import { debounce } from "lodash-es";

	import type { iInvalidInput } from "@open-xamu-co/ui-common-types";

	import type { InstanceBannerValues, InstanceValues } from "~/resources/types/values";
	import type { InstanceRef } from "~/resources/types/entities";
	import { getDocumentId } from "~/resources/utils/firestore";

	/**
	 * Admin root page
	 *
	 * @page
	 */
	definePageMeta({ title: "Ajustes" });

	const APP = useAppStore();
	const Swal = useSwal();
	const { getResponse } = useFormInput();

	const loading = ref(false);
	const invalidInstance = ref<iInvalidInput[]>([]);
	const instanceSEOInputs = ref(markRaw(useInstanceSEOInputs(APP.instance)));
	// Banner inputs
	const invalidBanner = ref<iInvalidInput[]>([]);
	const bannerInputs = ref(markRaw(useInstanceBannerInputs(APP.instance)));

	// const instanceConfig = computed(() => APP.config || {});

	const setInstance = debounce(async () => {
		const mergeInputs = instanceSEOInputs.value;

		const expectedInstance: Partial<InstanceValues> = {
			description: APP.instance?.description,
			keywords: APP.instance?.keywords?.join?.(", "),
		};

		loading.value = true;

		const { response, invalidInputs, withErrors, validationHadErrors, errors } =
			await getResponse<boolean, InstanceValues>(async (values) => {
				try {
					const diffValues = getValuesDiff(values, expectedInstance);

					// Prevent updating if values are equal
					if (!diffValues) return { data: undefined };

					const { keywords, ...updatedValues } = diffValues;
					const updatedRef: Partial<InstanceRef> = updatedValues;

					if (keywords !== undefined) {
						updatedRef.keywords = keywords.split(",").map((k) => k.trim());
					}

					// update instance
					const data = await useDocumentUpdate<InstanceRef>(
						{ id: `instances/${getDocumentId(APP.instance?.id)}` },
						updatedRef
					);

					return { data };
				} catch (errors) {
					return { errors };
				}
			}, mergeInputs);

		invalidInstance.value = invalidInputs;

		if (withErrors && !validationHadErrors) {
			if (!response && !errors) {
				Swal.fire({
					icon: "warning",
					title: "Sin cambios",
					text: "No puedes actualizar los datos sin realizar algún cambio primero",
				});
			} else {
				Swal.fire({
					title: "¡Algo sucedió!",
					text: "Ocurrio un error mientras actualizabamos la tienda",
					icon: "error",
				});
				useLogger("pages:administrar:setInstance", errors);
			}
		} else Swal.fire({ icon: "success" });

		loading.value = false;
	});

	const setBanner = debounce(async () => {
		const expectedBanner: Partial<InstanceBannerValues> = {
			message: APP.instance?.banner?.message || "",
			url: APP.instance?.banner?.url || "",
		};

		loading.value = true;

		const { response, invalidInputs, withErrors, validationHadErrors, errors } =
			await getResponse<boolean, InstanceBannerValues>(async (values) => {
				try {
					const diffValues = getValuesDiff(values, expectedBanner);

					// Prevent updating if values are equal
					if (!diffValues) return { data: undefined };

					// update instance
					const data = await useDocumentUpdate(
						{ id: `instances/${getDocumentId(APP.instance?.id)}` },
						{ banner: diffValues }
					);

					return { data };
				} catch (errors) {
					return { errors };
				}
			}, bannerInputs.value);

		invalidBanner.value = invalidInputs;

		if (withErrors && !validationHadErrors) {
			if (!response && !errors) {
				Swal.fire({
					icon: "warning",
					title: "Sin cambios",
					text: "No puedes actualizar el banner sin realizar algún cambio primero",
				});
			} else {
				Swal.fire({
					title: "¡Algo sucedió!",
					text: "Ocurrió un error mientras actualizábamos el banner",
					icon: "error",
				});
				useLogger("pages:administrar:setBanner", errors);
			}
		} else Swal.fire({ icon: "success" });

		loading.value = false;
	});
</script>
