<template>
	<section id="course" :key="routeCourseId" class="--width-100">
		<XamuLoaderContent
			class="x-course flx --flxColumn --flx-start --gap-30"
			:content="!!course"
			:loading="loading"
		>
			<template v-if="course">
				<div class="txt">
					<h2 :key="course.id">{{ course.name }}</h2>
					<p v-if="course.alternativeNames?.length" title="Otros nombres">
						{{ course.alternativeNames.join(", ") }}.
					</p>
					<p class="--txtSize-sm">Actualizado {{ updatedAt }}</p>
				</div>
				<div class="txt">
					<h4 class="">Herramientas:</h4>
					<p v-if="SESSION.canModerate && fromSIA === false" class="">
						Parece que este curso contiene datos erroneos, considera eliminarlo
					</p>
					<div class="flx --flxRow-wrap --flx-start-center">
						<XamuActionButton
							:disabled="!APP.instance?.flags?.trackCourses"
							@click="trackCourse"
						>
							Notificarme
						</XamuActionButton>
						<template v-if="SESSION.canModerate">
							<XamuModal
								class="--txtColor"
								title="Nuevo grupo"
								:save-button="{ title: 'Añadir grupo' }"
								invert-theme
								@close="closeAddGroup"
								@save="addGroup"
							>
								<template #toggle="{ toggleModal }">
									<XamuActionButton @click="toggleModal">
										Añadir grupo
									</XamuActionButton>
								</template>
								<template #default>
									<div class="--maxWidth-440">
										<XamuForm
											v-model="addGroupInputs"
											v-model:invalid="invalidAddGroup"
										/>
									</div>
								</template>
							</XamuModal>
							<XamuActionButton :theme="eColors.DANGER" @click="removeCourse">
								Eliminar
							</XamuActionButton>
						</template>
					</div>
				</div>
				<div class="grd --grdColumns-auto3 --gap">
					<div class="x-values grd-item">
						<XamuValueList
							:value="{
								sede: course.place,
								facultad: course.faculty,
								programas: course.programs,
								cuposDisponibles: course.spotsCount,
							}"
							:modal-props="{ class: '--txtColor', invertTheme: true }"
						/>
					</div>
					<div class="x-values grd-item">
						<XamuValueList
							:value="{
								código: course.code,
								créditos: course.credits,
								tipologías: course.typologies,
							}"
							:modal-props="{ class: '--txtColor', invertTheme: true }"
						/>
					</div>
				</div>
				<div v-if="mapGroups.length" class="flx --flxColumn --flx-start --width-100">
					<div class="txt">
						<h4>Grupos ({{ course.groupCount || course.groups?.length || 0 }}):</h4>
					</div>
					<XamuTable
						:nodes="mapGroups"
						:modal-props="{ class: '--txtColor', invertTheme: true }"
						class=""
					/>
				</div>
				<div v-if="mapUnreported.length" class="flx --flxColumn --flx-start --width-100">
					<div class="txt --gap-5">
						<h4>Grupos no reportados ({{ course.unreported?.length || 0 }}):</h4>
						<p class="--txtSize-xs">
							*Estos grupos estan activos en el SIA, pero aun no podemos actualizar
							sus cupos.
						</p>
					</div>
					<XamuTable
						:nodes="mapUnreported"
						:theme="eColors.PRIMARY"
						:modal-props="{ class: '--txtColor', invertTheme: true }"
						class=""
					/>
				</div>
			</template>
		</XamuLoaderContent>
	</section>
</template>

<script setup lang="ts">
	import { debounce } from "lodash-es";
	import { arrayUnion, doc, onSnapshot } from "firebase/firestore";
	import { FirebaseError } from "firebase/app";
	import type { iInvalidInput, iPageEdge } from "@open-xamu-co/ui-common-types";
	import { eColors } from "@open-xamu-co/ui-common-enums";

	import type { Course, Group, Teacher } from "~/resources/types/entities";
	import { resolveSnapshotDefaults } from "~/resources/utils/firestore";
	import { eSIAPlace } from "~/functions/src/types/SIA";

	/**
	 * Course page
	 *
	 * @page
	 */

	definePageMeta({
		path_label: "Curso",
		middleware: ["auth-only"],
	});

	const APP = useAppStore();
	const SESSION = useSessionStore();
	const router = useRouter();
	const route = useRoute();
	const Swal = useSwal();
	const { $clientFirestore } = useNuxtApp();
	const { getResponse } = useFormInput();

	const loading = ref(true);
	const course = ref<Course>();
	const fromSIA = ref<boolean>();
	const routeCourseId = computed(() => <string>route.params.courseId);
	const addGroupInputs = ref(markRaw(useGroupInputs()));
	const invalidAddGroup = ref<iInvalidInput[]>([]);

	const updatedAt = computed(() => {
		const date = new Date(course.value?.updatedAt || new Date());

		return useTimeAgo(date);
	});
	const mapGroups = computed(() => (course.value?.groups || []).map(mapGroupLike));
	const mapUnreported = computed(() => (course.value?.unreported || []).map(mapGroupLike));

	function mapGroupLike({
		name,
		activity,
		classrooms,
		teachers,
		schedule,
		spots,
		availableSpots,
	}: Group) {
		const reschedule = (schedule || []).map((interval) => {
			if (!interval) return;

			return interval.split("|").join(" a ");
		});

		const [lunes, martes, miercoles, jueves, viernes, sabado, domingo] = reschedule;

		classrooms = classrooms?.filter((c) => !!c);

		return {
			nombre: `${name}ㅤ`, // hotfix to prevent it to parse as date
			cupos: `${availableSpots} de ${spots}`,
			actividad: activity,
			espacios: classrooms,
			profesores: teachers,
			horarios: { lunes, martes, miercoles, jueves, viernes, sabado, domingo },
		};
	}

	const trackCourse = debounce(async () => {
		if (!course.value) return;

		SESSION.trackCourse(course.value);

		// Notify user of the success
		await Swal.fire({
			title: "Curso rastreado",
			text: `Obtendrás actualizaciones del curso ${course.value?.name} periódicamente`,
			icon: "success",
		});
	});

	const removeCourse = debounce(async () => {
		if (!SESSION.canModerate || !course.value) return;

		const { value } = await Swal.firePrevent({
			title: "Eliminar curso",
			text: "¿Esta seguro de querer eliminar este curso?",
			footer: "Borraremos toda su información, esta acción no es reversible, pero podra ser reindexado mas tarde",
		});

		if (!value) return;

		const removed = await useDocumentDelete(course.value);

		if (removed) {
			// Notify user of the success
			await Swal.fire({
				title: "Curso eliminado",
				text: "Este podra ser reindexado mas tarde",
				icon: "success",
			});

			return router.push("/");
		}

		Swal.fire({
			title: "Curso eliminado",
			text: "Algo paso, el curso pudo no ser eliminado",
			icon: "error",
		});
	});

	function closeAddGroup() {
		addGroupInputs.value = useGroupInputs();
		invalidAddGroup.value = [];
	}
	async function addGroup(willOpen: () => void, event: Event) {
		const { invalidInputs, withErrors, validationHadErrors, errors } = await getResponse<
			boolean | null,
			Pick<
				Group,
				"name" | "spots" | "availableSpots" | "teachers" | "classrooms" | "schedule"
			>
		>(
			async (newGroup) => {
				if (!course.value) return { data: null };

				try {
					// update category
					const data = await useDocumentUpdate<Course>(course.value, {
						unreported: arrayUnion(newGroup),
					});

					return { data };
				} catch (errors: FirebaseError | unknown) {
					return { errors };
				}
			},
			addGroupInputs.value,
			event
		);

		invalidAddGroup.value = invalidInputs;

		if (!withErrors) {
			// Succesful request, notify user of the success
			Swal.fire({
				title: "Grupo añadido exitosamente",
				text: "En breve veras tu grupo nuevo",
				icon: "success",
				willOpen,
			});
		} else {
			if (!validationHadErrors) {
				Swal.fire({
					title: "¡Algo sucedió!",
					text: "Ocurrió un error mientras añadiamos el grupo",
					icon: "error",
					target: <HTMLElement>event.target,
				});

				if (errors instanceof FirebaseError) console.debug(errors.code, errors);
				else console.error(errors);
			}
		}
	}

	// lifecycle

	/**
	 * Get course from firebase, then SIA & reindex
	 */
	const unsub = onSnapshot(doc($clientFirestore, "courses", routeCourseId.value), (snapshot) => {
		if (!snapshot.exists()) {
			throw createError({
				statusCode: 404,
				statusMessage: "El curso que buscas no esta indexado o no existe",
			});
		}

		const firebaseCourse: Course = resolveSnapshotDefaults(snapshot.ref.path, snapshot.data());
		const {
			id,
			code = "",
			programs = [],
			place = eSIAPlace.BOGOTÁ,
			updatedAt,
		} = firebaseCourse;
		const updatedAtMilis = new Date(updatedAt || "").getTime();
		const nowMilis = new Date().getTime();
		const millisDiff = nowMilis - updatedAtMilis;
		const minutes = APP.instance?.config?.coursesRefreshRate || 5;

		// Do once & update if updated more than threshold
		if (fromSIA.value === undefined && millisDiff > minutes * 60 * 1000) {
			// Get data from sia & reindex, do not await
			Promise.all([
				useSIACourses({ code, program: programs[0], place }),
				$fetch<iPageEdge<Teacher, string>[]>("/api/teachers/search", {
					query: { courses: [code] },
					cache: "no-cache",
					headers: { canModerate: SESSION.token || "" },
				}),
			]).then(([{ data }, indexedTeachers]) => {
				// Omit courses without groups
				const courses = data
					.map(useMapCourseFromSia)
					.filter(({ groups }) => !!groups?.length);
				const SIACourse = courses.find((c) => c.id === id);

				if (!SIACourse) {
					fromSIA.value = false;

					return;
				}

				// refresh if same course
				if (SIACourse.code === course.value?.code) {
					course.value = { ...course.value, ...useMapCourse(SIACourse) };
				}

				// Reindex, do not await
				return useIndexCourse({ ...SIACourse, updatedAt, indexed: true, indexedTeachers });
			});
		}

		route.meta.title = firebaseCourse.name;
		course.value = useMapCourse(firebaseCourse);
		loading.value = false;
	});

	onBeforeUnmount(unsub);
</script>

<style lang="scss">
	@use "@/assets/scss/overrides" as utils;

	@media only screen {
		.x-values [title^="Cantidad"] {
			&,
			.flx {
				flex-wrap: wrap;
			}
		}

		tbody [data-column-name="name"] span {
			color: transparent;
		}
		tbody [data-column-name="name"] span:before {
			content: attr(title);
			position: absolute;
			top: 0;
			left: 0;
			color: utils.color(dark, 0.7);
		}
		tbody [data-column-name="programs"] {
			max-width: none;
		}
	}
</style>
