<template>
	<div id="landing" class="view">
		<section class="view-item --minHeightVh-100 --bgColor-light">
			<XamuLoaderContent
				class="holder flx --flxColumn --flx-center-stretch --maxWidth-1080"
				:content="!!course"
				:loading="coursePending"
				:errors="courseError"
				label="Cargando curso..."
				no-content-message="No se encontró el curso"
			>
				<div v-if="USER.token" class="flx --flxRow-wrap --flx-between-center --width-100">
					<div class="flx --flxRow-wrap --flx-start-center">
						<XamuActionButton
							:theme="estudiantesTheme"
							tooltip="Ver en los estudiantes"
							:href="`${losEstudiantesCourses}/${course?.losEstudiantesCode}?from=cuna.com.co`"
							:disabled="!course?.losEstudiantesCode"
							round
						>
							<XamuIconFa name="hand-fist" />
						</XamuActionButton>
					</div>
					<div class="flx --flxRow-wrap --flx-start-center">
						<XamuActionButton tooltip="Actualizar" @click="refreshAll">
							<XamuIconFa name="refresh" />
						</XamuActionButton>
						<XamuActionButton
							v-if="USER.canDevelop"
							tooltip="¿Se indexo con errores?"
							:theme="eColors.DANGER"
							@click="removeCourse"
						>
							Eliminar curso
						</XamuActionButton>
					</div>
				</div>
				<div class="flx --flxColumn --flx-start">
					<h2 :key="course?.id">
						{{ course?.name }} {{ groupsData.filtered[0]?.semestre }}
					</h2>
					<div class="flx --flxColumn --flx-start --gap-5">
						<p v-if="course?.alternativeNames?.length" title="Otros nombres">
							{{ course.alternativeNames.join(", ") }}.
						</p>
						<p v-if="course?.updatedAt" class="--txtSize-xs --txtColor-dark5">
							<span>Actualizado {{ useTimeAgo(new Date(course.updatedAt)) }}</span>
							<span v-if="USER.canDevelop && course.scrapedAt">
								⋅ SIA {{ useTimeAgo(new Date(course.scrapedAt)) }}
							</span>
						</p>
					</div>
					<p v-if="course?.description" class="--txtSize-sm --txtLineHeight-xl">
						{{ course.description }}
					</p>
				</div>
				<div class="grd --grdColumns-auto3 --gap">
					<div class="x-values grd-item">
						<XamuValueList
							:value="{
								código: course?.code,
								créditos: course?.credits,
								cuposDisponibles: groupsData.spots || '??',
								actividad: groupsData.activity || 'No definida',
							}"
							:modal-props="{ class: '--txtColor', invertTheme: true }"
						/>
					</div>
					<div class="x-values grd-item">
						<XamuValueList
							:value="{
								sede: course?.place,
								facultades: course?.faculties,
								programas: course?.programs,
								tipologías: course?.typologies,
							}"
							:modal-props="{ class: '--txtColor', invertTheme: true }"
						/>
					</div>
				</div>
				<div class="flx --flxRow-wrap --flx-center --gap-5 --txtSize-xs">
					<div class="flx --flxColumn --flx-start --gap-5 --width-100 --maxWidth-220">
						<p class="">Facultad</p>
						<XamuSelect
							id="faculty"
							v-model="selectedFaculty"
							class="--width-180 --minWidth-100"
							:options="faculties"
							:size="eSizes.XS"
							required
						/>
					</div>
					<div class="flx --flxColumn --flx-start --gap-5 --width-100 --maxWidth-220">
						<p class="">Programa</p>
						<XamuSelect
							id="program"
							v-model="selectedProgram"
							class="--width-180 --minWidth-100"
							:options="programs"
							:size="eSizes.XS"
							required
						/>
					</div>
					<div class="flx --flxColumn --flx-start --gap-5 --width-100 --maxWidth-220">
						<p class="">Tipología</p>
						<XamuSelect
							id="typology"
							v-model="selectedTypology"
							class="--width-180 --minWidth-100"
							:options="typologies"
							:size="eSizes.XS"
						/>
					</div>
				</div>
				<XamuLoaderContent
					:content="!!groupsData.filtered.length"
					:loading="groupsPending"
					:errors="groupsError"
					:el="ClientOnly"
					label="Cargando grupos desde el SIA..."
					no-content-message="No hay grupos programados"
					client
				>
					<template #fallback>Cargando grupos...</template>
					<XamuTable
						v-bind="{
							preferId: true,
							properties: [
								{
									value: 'inscrito',
									component: TableEnroll,
									hidden: !USER.token,
								},
								{ value: 'profesores', component: TableTeachersList },
								{ value: 'horarios', component: TableWeek },
							],
							modalProps: {
								invertTheme: true,
								class: '--txtColor',
							},
						}"
						:nodes="groupsData.filtered"
					/>
				</XamuLoaderContent>
			</XamuLoaderContent>
		</section>
	</div>
</template>

<script setup lang="ts">
	import debounce from "lodash-es/debounce";
	import deburr from "lodash-es/deburr";
	import { doc, DocumentReference, onSnapshot, type Unsubscribe } from "firebase/firestore";

	import type { iPageEdge } from "@open-xamu-co/ui-common-types";
	import { eColors, eSizes } from "@open-xamu-co/ui-common-enums";

	import type { Course, Group, GroupEs } from "~/utils/types";

	import { TableTeachersList, TableEnroll, TableWeek, ClientOnly } from "#components";
	import { eSIATypology } from "~~/functions/src/types/SIA";

	/**
	 * Course page
	 *
	 * @page
	 */

	definePageMeta({ middleware: ["course-exists"] });

	const CUNA = useCunaStore();
	// const INSTANCE = useInstanceStore();
	const USER = useUserStore();
	const router = useRouter();
	const route = useRoute();
	const Swal = useSwal();
	const { $clientFirestore, $resolveClientRefs } = useNuxtApp();

	let unsub: Unsubscribe = () => undefined;

	const estudiantesTheme = "estudiantes" as any;
	const deactivated = ref(false);

	const courseId = computed(() => <string>route.params.courseId);
	const losEstudiantesCourses = computed(() => {
		const config = CUNA.config || {};
		const { losEstudiantesUrl = "", losEstudiantesCoursesPath = "" } = config;

		return `${losEstudiantesUrl}${losEstudiantesCoursesPath}`;
	});
	/** Place without "sede" */
	const placeOnly = computed(() => {
		const [, placeOnly] = deburr(USER.place).toLowerCase().replace(" de la", "").split("sede ");

		return placeOnly;
	});
	const selectedLevel = computed({
		get: () => USER.level,
		set: (value) => {
			USER.setLevel(value);
		},
	});
	const selectedPlace = computed({
		get: () => USER.place,
		set: (value) => {
			USER.setPlace(value);
		},
	});

	const {
		data: course,
		pending: coursePending,
		refresh: refreshCourse,
		error: courseError,
	} = useAsyncData(
		`api:instance:all:courses:${courseId.value}`,
		async () => {
			const courseApiPath = `/api/instance/all/courses/${courseId.value}`;

			return useQuery<Course>(courseApiPath, {
				headers: { "Cache-Control": "no-store" },
				cache: "no-store",
			});
		},
		{ watch: [() => courseId.value], server: false }
	);

	const { selectedFaculty, faculties, selectedProgram, programs } = useCourseProgramOptions(
		[selectedLevel, selectedPlace, USER.lastFacultySearch, USER.lastProgramSearch],
		true,
		course
	);
	const { selectedTypology, typologies } = useCourseTypeOptions([], course);

	/** Async data key */
	const courseGroupsKey = computed(() => {
		const baseKey = `api:instance:courses:${courseId.value}:groups:${selectedProgram.value}`;

		if (selectedTypology.value) return `${baseKey}:${selectedTypology.value}`;

		return baseKey;
	});

	const {
		data: groups,
		pending: groupsPending,
		refresh: refreshGroups,
		error: groupsError,
	} = useAsyncData<iPageEdge<Group>[]>(
		courseGroupsKey.value,
		async () => {
			const courseApiPath = `/api/instance/courses/${courseId.value}/groups`;

			return useCsrfQuery(courseApiPath, {
				query: {
					faculty: selectedFaculty.value,
					program: selectedProgram.value,
					typology: selectedTypology.value,
					level: 1, // Get teachers refs
				},
				method: "POST",
				headers: { "Cache-Control": "no-store" },
				cache: "no-store",
			});
		},
		{ watch: [() => courseId.value, selectedProgram, selectedTypology], server: false }
	);

	/**
	 * Get filtered groups metadata
	 * Current implementation requires 2 loops (O(2n))
	 */
	const groupsData = computed(() => {
		/** There are groups with the current place in their name */
		let withThisPlace = false;
		/** There are groups with other places in their name */
		let withOtherPlaces = false;
		let activity = "";
		let spots = 0;

		// Get place flags
		for (const { node } of groups.value || []) {
			const lowerName = deburr(node.name).toLowerCase();

			activity ||= node.activity || activity;

			if (lowerName.includes(placeOnly.value)) withThisPlace = true;
			if (lowerName.includes("otras sedes")) withOtherPlaces = true;
		}

		const filtered: GroupEs[] = [];

		// Filter groups
		for (const { node } of groups.value || []) {
			const lowerName = deburr(node.name).toLowerCase();
			const nonRegular = lowerName.includes("peama") || lowerName.includes("paes");
			const isThisPlace = lowerName.includes(placeOnly.value);
			const isOtherPlace = lowerName.includes("otras sedes");

			// Filter by user preferences
			if (
				(!USER.withNonRegular && nonRegular) ||
				(withThisPlace && !isThisPlace) ||
				(withOtherPlaces && !isOtherPlace)
			) {
				continue;
			}

			// If missing, filter by typology (not LE)
			// Assume filtered otherwise
			if (!selectedTypology.value && node.typology === eSIATypology.LIBRE_ELECCIÓN) continue;

			filtered.push(useMapGroupEs(node));
			spots += node.availableSpots || 0;
		}

		return { filtered, activity, spots };
	});

	function refreshAll() {
		refreshCourse();
		refreshGroups();
	}

	const removeCourse = debounce(async () => {
		if (!USER.canModerate || !course.value?.id) return;

		const { value } = await Swal.firePrevent({
			title: "Eliminar curso",
			text: "¿Esta seguro de querer eliminar este curso?",
			footer: "Borraremos toda su información, esta acción no es reversible, pero podra ser reindexado mas tarde",
		});

		if (!value) return;

		unsub(); // close firebase socket

		const removed = await useDocumentDelete({ id: course.value.id });

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

	// lifecycle
	watch(
		[course, courseError],
		([newCourse, newError], [oldCourse]) => {
			unsub();

			if (newError) return showError(newError);

			if (newCourse?.id && newCourse.updatedAt !== oldCourse?.updatedAt) {
				const { name, description, alternativeNames = [name] } = newCourse;

				// Update meta
				route.meta.title = name;
				route.meta.description = description;
				route.meta.keywords = alternativeNames.join(", ");

				if (import.meta.server || !USER.token || !$clientFirestore || !$resolveClientRefs) {
					return;
				}

				const courseRef: DocumentReference<Course> = doc($clientFirestore, newCourse.id);

				// Hydrate course from firebase (Scraped server side)
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

					const courseData = await $resolveClientRefs(snapshot);

					// Hydrate course
					if (courseData?.id) {
						course.value = courseData;

						refreshGroups();
					}
				});
			}
		},
		{ immediate: true }
	);
	onBeforeUnmount(unsub);
	onActivated(() => (deactivated.value = false));
	onDeactivated(() => (deactivated.value = true));
</script>

<style lang="scss">
	@media only screen {
		.x-values {
			span.--txtSize-xs[title] {
				color: xamu.color(dark, 0.5);
			}
			[title^="Cantidad"] {
				&,
				.flx {
					flex-wrap: wrap;
				}
			}
		}

		tbody [data-column-name="name"] span {
			color: transparent;
		}
		tbody [data-column-name="name"] span::before {
			content: attr(title);
			position: absolute;
			top: 0;
			left: 0;
			color: xamu.color(dark, 0.7);
		}
		tbody [data-column-name="programs"] {
			max-width: none;
		}
	}
</style>
