<template>
	<section id="course" :key="course?.id" class="--width-100">
		<XamuLoaderContent
			class="x-course flx --flxColumn --flx-start --gap-30"
			:content="!!course"
			:loading="pending"
		>
			<template v-if="course">
				<div class="txt">
					<h2 :key="course.id">{{ course.name }}</h2>
					<p v-if="course.alternativeNames?.length" title="Otros nombres">
						{{ course.alternativeNames.join(", ") }}.
					</p>
					<p class="--txtSize-sm">Actualizado {{ courseUpdatedAt }}</p>
				</div>
				<div class="flx --flxColumn --flx-start --width-100">
					<div class="txt">
						<h4 class="">Herramientas:</h4>
						<p v-if="SESSION.canModerate && fromSIA === false" class="">
							Parece que este curso contiene datos erroneos, considera eliminarlo
						</p>
					</div>
					<div class="flx --flxRow-wrap --flx-between-center --width-100">
						<div class="flx --flxRow-wrap --flx-start-center">
							<XamuActionButton
								:theme="'estudiantes' as any"
								tooltip="Ver en los estudiantes"
								:href="`${losEstudiantesCourses}/${course.losEstudiantesCode}?from=cuna`"
								:size="eSizes.LG"
								:disabled="!course.losEstudiantesCode"
								round
							>
								<XamuIconFa name="hand-fist" :size="20" />
							</XamuActionButton>
							<XamuActionButtonToggle
								tooltip="Notificarme"
								:disabled="!APP.instance?.flags?.trackCourses"
								:size="eSizes.LG"
								round
								@click="trackCourse"
							>
								<XamuIconFa name="bell" :size="20" regular />
								<XamuIconFa name="bell" :size="20" />
							</XamuActionButtonToggle>
						</div>
						<div
							v-if="SESSION.canModerate"
							class="flx --flxRow-wrap --flx-start-center"
						>
							<XamuModal
								class="--txtColor"
								title="Añadir grupo no reportado"
								:save-button="{ title: 'Añadir grupo' }"
								invert-theme
								@close="closeAddGroup"
								@save="addGroup"
							>
								<template #toggle="{ toggleModal }">
									<XamuActionButton
										tooltip="¿Hay un grupo no reportado?"
										@click="toggleModal"
									>
										Añadir grupo
									</XamuActionButton>
								</template>
								<template #default>
									<div class="--maxWidth-440">
										<XamuForm
											v-model="addGroupInputs"
											v-model:invalid="invalidAddGroup"
											title="Nuevo grupo"
										/>
									</div>
								</template>
							</XamuModal>
							<XamuActionButton
								tooltip="¿Se indexo con errores?"
								:theme="eColors.DANGER"
								@click="removeCourse"
							>
								Eliminar
							</XamuActionButton>
						</div>
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
				<XamuLoaderContent
					:loading="pending || refetching"
					:content="!!mapGroups.length || !!mapUnreported.length"
					label="Actualizando desde el SIA..."
					class="--width-100"
				>
					<div v-if="mapGroups.length" class="flx --flxColumn --flx-start --width-100">
						<div class="txt">
							<h4>Grupos ({{ course.groupCount || course.groups?.length || 0 }}):</h4>
						</div>
						<XamuTable
							:nodes="mapGroups"
							:modal-props="{ class: '--txtColor', invertTheme: true }"
							:properties="[{ value: 'profesores', component: TeachersList }]"
						/>
					</div>
					<div
						v-if="mapUnreported.length"
						class="flx --flxColumn --flx-start --width-100"
					>
						<div class="txt --gap-5">
							<h4>Grupos no reportados ({{ course.unreported?.length || 0 }}):</h4>
							<p class="--txtSize-xs">
								*Estos grupos estan activos en el SIA, pero aun no podemos
								actualizar sus cupos.
							</p>
						</div>
						<XamuTable
							:nodes="mapUnreported"
							:theme="eColors.PRIMARY"
							:modal-props="{ class: '--txtColor', invertTheme: true }"
							:properties="[{ value: 'profesores', component: TeachersList }]"
						/>
					</div>
				</XamuLoaderContent>
			</template>
		</XamuLoaderContent>
	</section>
</template>

<script setup lang="ts">
	import { debounce, startCase } from "lodash-es";
	import { arrayUnion, doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
	import { FirebaseError } from "firebase/app";
	import type { iInvalidInput, iPageEdge } from "@open-xamu-co/ui-common-types";
	import { eColors, eSizes } from "@open-xamu-co/ui-common-enums";

	import type { Course, Group, Teacher } from "~/resources/types/entities";
	import { resolveSnapshotDefaults } from "~/resources/utils/firestore";
	import { eSIALevel, eSIAPlace } from "~/functions/src/types/SIA";
	import { TeachersList } from "#components";

	type tCourseAndTeachers = [Course, iPageEdge<Teacher, string>[]];

	/**
	 * Course page
	 *
	 * @page
	 */

	definePageMeta({
		path_label: "Curso",
		middleware: ["auth-only", "course-exists"],
	});

	const APP = useAppStore();
	const SESSION = useSessionStore();
	const router = useRouter();
	const route = useRoute();
	const Swal = useSwal();
	const { $clientFirestore } = useNuxtApp();
	const { getResponse } = useFormInput();

	const { losEstudiantesUrl = "", losEstudiantesCoursesPath = "" } = APP.instance?.config || {};
	const losEstudiantesCourses = `${losEstudiantesUrl}${losEstudiantesCoursesPath}`;
	const refetching = ref(false);
	const deactivated = ref(false);
	const fromSIA = ref<boolean>();
	const addGroupInputs = ref(markRaw(useGroupInputs()));
	const invalidAddGroup = ref<iInvalidInput[]>([]);
	let unsub: Unsubscribe = () => undefined;

	const { data: courseAndTeachers, pending } = useAsyncData<tCourseAndTeachers>(async () => {
		const courseId = <string>route.params.courseId;
		const nuxtCourse = await useFetchQuery<Course>(`/api/all/courses/${courseId}`);
		const { name, code } = nuxtCourse;

		// Update meta
		route.meta.title = name;

		const teachersEdges = await useFetchQuery<iPageEdge<Teacher, string>[]>(
			"/api/teachers/search",
			{ courses: [code] }
		);

		return [nuxtCourse, teachersEdges];
	});

	const course = computed({
		get: () => courseAndTeachers.value?.[0],
		set(newCourse) {
			if (!newCourse) return;

			courseAndTeachers.value = [newCourse, courseAndTeachers.value?.[1] || []];
		},
	});
	const indexedTeachers = computed(() => {
		return (courseAndTeachers.value?.[1] || []).map(({ node }) => node);
	});
	const courseUpdatedAt = computed(() => {
		const date = new Date(course.value?.updatedAt || new Date());

		return useTimeAgo(date);
	});
	const mapGroups = computed(() => (course.value?.groups || []).map(mapGroupLike));
	const mapUnreported = computed(() => (course.value?.unreported || []).map(mapGroupLike));

	function mapGroupLike({
		name,
		activity,
		classrooms,
		teachers = [],
		schedule,
		spots,
		availableSpots,
	}: Group) {
		const reschedule = (schedule || []).map((interval) => {
			if (!interval) return;

			return interval.split("|").join(" a ");
		});

		const [lunes, martes, miercoles, jueves, viernes, sabado, domingo] = reschedule;
		const mappedTeachers = teachers.map((name) => {
			const teacher = indexedTeachers.value?.find((t) => t.name === name);

			return teacher || name;
		});

		classrooms = classrooms?.filter((c) => !!c);

		return {
			nombre: `${name}ㅤ`, // hotfix to prevent it to parse as date
			cupos: `${availableSpots} de ${spots}`,
			actividad: activity,
			espacios: classrooms,
			profesores: mappedTeachers,
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

		unsub(); // close firebase socket

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

	onActivated(() => (deactivated.value = false));
	onDeactivated(() => (deactivated.value = true));
	onBeforeUnmount(unsub);
	onMounted(() => {
		if (process.server) return;

		const courseId = <string>route.params.courseId;
		const courseRef = doc($clientFirestore, "courses", courseId);

		// Hydrate course from firebase, then SIA & reindex
		unsub = onSnapshot(courseRef, async (snapshot) => {
			// prevent hydration if not active
			if (deactivated.value) return;
			if (!snapshot.exists()) {
				unsub();

				throw showError({
					statusCode: 404,
					statusMessage: "El curso que buscas fue eliminado.",
				});
			}

			const firebaseCourse: Course = resolveSnapshotDefaults(
				snapshot.ref.path,
				snapshot.data()
			);
			const {
				id,
				name,
				code = "",
				level = eSIALevel.PREGRADO,
				place = eSIAPlace.BOGOTÁ,
				faculty,
				programs = [],
				typologies = [],
				updatedAt,
			} = firebaseCourse;

			// Update with hydration conditionally
			if (course.value?.updatedAt !== updatedAt) {
				route.meta.title = name; // Update meta
				course.value = useMapCourse(firebaseCourse);
			}

			const minutes = APP.instance?.config?.coursesRefreshRate || 5;
			const nowMilis = new Date().getTime();
			const updatedAtMilis = new Date(updatedAt || "").getTime();
			const updatedDiffMilis = nowMilis - updatedAtMilis;

			// Do once & update if updated more than threshold
			if (
				refetching.value ||
				fromSIA.value !== undefined ||
				(firebaseCourse?.scrapedAt && updatedDiffMilis < useMinMilis(minutes))
			) {
				return;
			}

			refetching.value = true;

			try {
				// Get data from sia & reindex
				const [{ data }, SIAgroups] = await Promise.all([
					useSIACourses({ level, place, program: programs[0], code }),
					useFetchQuery<Group[] | null>("/api/groups/scrape", {
						level,
						place,
						faculty,
						program: programs[0],
						typology: typologies[0],
						code,
					}),
				]);

				// Omit courses without groups
				const courses = data
					.map(useMapCourseFromSia)
					.filter(({ groups }) => !!groups?.length);
				let SIACourse = courses.find((c) => c.id === id);

				if (!SIACourse) {
					fromSIA.value = false;

					return;
				}

				// Prefer scrapped groups
				if (SIAgroups) {
					SIACourse = {
						...SIACourse,
						groups: SIAgroups.map(({ spots = 0, teachers = [], ...group }) => {
							const SIA = SIACourse?.groups?.find(({ name }) => name === group.name);

							return {
								...group,
								spots: SIA?.spots || spots,
								teachers: teachers.map((t) => startCase(t.toLowerCase())),
							};
						}),
						scrapedAt: new Date(),
					};
				}

				// Reindex, refresh is done by firebase
				await useIndexCourse({ ...SIACourse, updatedAt }, firebaseCourse);
			} catch (err) {
				console.error(err);
			}

			refetching.value = false;
		});
	});
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
