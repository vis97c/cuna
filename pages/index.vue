<template>
	<div id="landing" class="view">
		<section class="view-item --minHeightVh-100">
			<div class="holder">
				<div class="grd --grdColumns-auto2 --grdColumns-3:lg">
					<div class="grd-item flx --flxColumn --flx-center">
						<div class="--txtAlign-center">
							<h1 class="--txtSize-mx:md">
								<b>Cuna</b>
							</h1>
							<p class="">Visor de cursos UNAL</p>
						</div>
					</div>
					<div class="grd-item --grdColumnSpan-2:lg flx --flxColumn --flx-center">
						<form class="flx --flxColumn --flx-start --gap-30" action="#" method="post">
							<div class="txt">
								<div class="txt --gap-0">
									<h4 class="">Registrar curso.</h4>
									<p class="--txtSize-sm">Curso nuevo, no rastreado.</p>
								</div>
								<p class="--txtSize-xs --txtColor-dark5">
									* Este campo es requerido.
								</p>
							</div>
							<div
								class="flx --flxColumn --flx-start-stretch --width-100 --minWidthVw-30 --maxWidth-100"
							>
								<XamuForm
									v-model="courseInputs"
									v-model:invalid="invalid"
									no-form
								/>
							</div>
							<XamuActionButton type="submit" @click.prevent="searchUntrackedCourse">
								<XamuIconFa name="magnifying-glass" />
								<span>Buscar curso</span>
							</XamuActionButton>
						</form>
					</div>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
	import type { iInvalidInput, iSelectOption } from "@open-xamu-co/ui-common-types";
	import { FirebaseError } from "firebase/app";
	import { debounce } from "lodash-es";

	import { eSIAScienceProgram, type SIACoursesResponse } from "~/functions/src/types/SIA";
	import type { CourseRef } from "~/resources/types/entities";
	import type { CourseValues } from "~/resources/types/values";

	/**
	 * Landing page
	 *
	 * @page
	 */

	definePageMeta({
		path_label: "Inicio",
		title: "Inicio",
	});

	const Swal = useSwal();
	const { getResponse } = useFormInput();
	// const router = useRouter();

	const invalid = ref<iInvalidInput[]>([]);
	const loading = ref(false);
	const programs: iSelectOption[] = Object.values(eSIAScienceProgram).map((value) => ({ value }));
	/**
	 * markRaw required here due to unwrap issue with ts limitations
	 * @see https://github.com/vuejs/core/issues/2981
	 */
	const courseInputs = ref(markRaw(useCourseInputs({ programs })));

	/**
	 * Create new user with email & password
	 */
	const searchUntrackedCourse = debounce(async () => {
		loading.value = true;

		const { response, invalidInputs, withErrors, validationHadErrors } = await getResponse<
			SIACoursesResponse,
			CourseValues
		>(async ({ program, code, name }) => {
			try {
				const data = {};

				return { data };
			} catch (errors: FirebaseError | unknown) {
				return { errors };
			}
		}, courseInputs.value);

		invalid.value = invalidInputs;

		if (!withErrors) {
			// do if no errors
		} else {
			if (!validationHadErrors) {
				Swal.fire({
					title: "¡Algo sucedió!",
					text: "Ocurrió un error mientras buscabamos el curso",
					icon: "error",
				});
			}
		}

		loading.value = false;
	});

	/**
	 * Create new course
	 */
	async function createCourse(willOpen: () => void, event: Event) {
		try {
			// create course
			const data = await useDocumentCreate<CourseRef>("courses", {});

			// Succesful request, notify user of the success
			Swal.fire({
				title: "Curso añadido exitosamente",
				text: "Ya estamos dando seguimiento a sus cupos",
				icon: "success",
				willOpen,
			});
		} catch (err) {
			Swal.fire({
				title: "¡Algo sucedió!",
				text: "Ocurrió un error mientras añadiamos el curso",
				icon: "error",
				target: <HTMLElement>event.target,
			});

			if (err instanceof FirebaseError) console.debug(err.code, err);
			else console.error(err);
		}
	}
</script>

<style lang="scss">
	@use "@/assets/scss/overrides" as utils;

	@media only screen {
	}
</style>
