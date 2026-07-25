<template>
	<div id="landing" class="view">
		<section class="view-item --minHeightVh-100 --bgColor-light">
			<div class="holder flx --flxColumn --flx-center">
				<div class="txt --txtAlign-center --gap-5">
					<h1 class="--txtLineHeight-sm">
						<XamuActionLink to="/" class="no--override no--route --gap">
							<span class="--txtLineHeight-sm">cuna</span>
							<XamuIconFa name="chess-knight" :size="10" />
						</XamuActionLink>
						<span class="--txtSize-md --txtColor-primary --mLeft-5">Web</span>
					</h1>
					<div class="flx --flxRow --flx-center --gap-10">
						<p>Visor de cursos UNAL</p>
						<XamuActionLink
							class="x-info"
							:theme="eColors.DARK"
							tooltip="Cuna no esta afiliada a la UNAL"
							tooltip-as-text
						>
							<XamuIconFa name="circle-info" />
						</XamuActionLink>
					</div>
					<div class="flx --flxRow --flx-center --gap-10 --txtSize-xs --txtColor-dark5">
						<XamuActionLink
							href="https://github.com/vis97c/cuna"
							tooltip="Código fuente. GNU GPL v3"
						>
							<XamuIconFa name="github" brand />
						</XamuActionLink>
						<span v-if="INSTANCE.config?.version">
							{{ INSTANCE.config.version }} Powered by
							<a href="https://xamu.com.co" target="_blank" rel="noopener noreferrer">
								Xamu.
							</a>
						</span>
					</div>
				</div>
				<div v-if="INSTANCE.SIAMaintenance" class="txt --txtAlign-center --gap-10">
					<h4>El SIA se encuentra en mantenimiento</h4>
					<p class="--txtSize-sm --txtColor-dark5">
						Puedes explorar los cursos previamente guardados, pero el buscador estará
						inactivo y los cursos no se actualizarán hasta que el mantenimiento termine.
					</p>
					<p
						class="--txtSize-xs --txtColor-dark5"
						:title="INSTANCE.config?.siaMaintenanceTillAt?.toString()"
					>
						Volveremos a la normalidad {{ SIAMaintenanceTillAt }}.
					</p>
				</div>
				<div
					v-else-if="!SESSION.token && route.path != '/ingresar'"
					class="txt --txtAlign-center --gap-10"
				>
					<h4>Modo lectura</h4>
					<p class="--txtSize-sm --txtColor-dark5">
						Inicia sesión para obtener una experiencia completa con notas, búsqueda
						filtrada de cursos por sede, información de cupos actualizada, así como
						otras novedades.
					</p>
				</div>
				<ClientOnly>
					<template #fallback>Cargando buscador...</template>
					<XamuBaseBox
						el="form"
						class="x-box flx --flxColumn --flx-start-stretch --width-100 --maxWidth-770 --p-20:md"
						transparent
					>
						<form
							class="flx --flxColumn --flx-start-stretch --width-100"
							@submit.prevent="emittedRefresh"
						>
							<div class="flx --flxRow --flx-start-center --gap-5 --width-100">
								<div class="--flx">
									<XamuInputText
										id="search"
										v-model="search"
										placeholder="Nombre o codigo del curso..."
										autocomplete="off"
										icon="magnifying-glass"
										:size="eSizes.LG"
										aria-label="Buscar curso por nombre o código"
										class="--minWidth-100"
									/>
									<XamuActionLink
										v-if="search"
										class="x-search-reset"
										aria-label="Limpiar búsqueda"
										@click="() => (search = '')"
									>
										<XamuIconFa name="xmark" :size="20" />
									</XamuActionLink>
								</div>
							</div>
							<div
								class="flx --flxRow-wrap --flx-start-center --gap-5 --txtSize-xs --width-100"
							>
								<div class="flx --flxColumn --flx-start --flx --gap-5">
									<label for="faculty">Facultad</label>
									<XamuSelect
										id="faculty"
										v-model="selectedFaculty"
										class="--width-180 --minWidth-100"
										:options="faculties"
										:size="eSizes.XS"
										required
									/>
								</div>
								<div class="flx --flxColumn --flx-start --flx --gap-5">
									<label for="program">Programa</label>
									<XamuSelect
										id="program"
										v-model="selectedProgram"
										class="--width-180 --minWidth-100"
										:options="programs"
										:size="eSizes.XS"
										:disabled="!selectedFaculty || !programs.length"
										required
									/>
								</div>
								<div class="flx --flxColumn --flx-start --flx --gap-5">
									<label for="typology">Tipología</label>
									<XamuSelect
										id="typology"
										v-model="selectedTypology"
										class="--width-180 --minWidth-100"
										:options="typologies"
										:size="eSizes.XS"
										:disabled="isCodeSearch"
									/>
								</div>
							</div>
						</form>
					</XamuBaseBox>
					<XamuPaginationContent
						v-if="search && search.trim().length >= 3"
						v-slot="{ content }"
						class="flx --flxColumn --flx-start-center --gap-30 --width-100 --maxWidth-770"
						:page="coursesSearchPage"
						url="api:instance:courses:search"
						:defaults="{ page: true, ...values }"
						:first="25"
						:no-content-message="
							search
								? `Sin resultados para ${search}. Intenta con otro término.`
								: 'No hay cursos disponibles. Intenta de nuevo más tarde.'
						"
						label="Cargando cursos guardados..."
						hide-controls="single"
						with-route
						client
						@refresh="(e) => (emittedRefresh = e)"
					>
						<div class="txt">
							<h3>Resultados de búsqueda</h3>
						</div>
						<div class="grd --grdColumns-auto3 --gap-20 --width-100">
							<ItemCourse
								v-for="course in content"
								:key="course.id"
								:course="course"
								class="grd-item"
							/>
							<XamuBaseBox
								v-for="i in (3 - (content.length % 3)) % 3"
								:key="i"
								class="x-course-placeholder --width-100 --height-100"
								hidden=":md-inv"
								disabled
								button
							/>
						</div>
					</XamuPaginationContent>
					<div v-else class="flx --flxColumn --flx-center --width-100">
						<div class="txt">
							<h3 class="--txtColor-dark5">Otros recursos</h3>
						</div>
						<div class="scroll --horizontal --always --maxWidth-100">
							<ul class="x-items flx --flxRow --flx-center --width-fit">
								<li class="x-fit">
									<XamuBoxAction
										to="/notas"
										icon="sticky-note"
										label="Explora las notas"
									/>
								</li>
								<li class="x-fit">
									<XamuBoxAction
										to="/descargar"
										icon="download"
										label="Cuna Desktop"
									/>
								</li>
								<li class="x-fit">
									<XamuBoxAction
										:theme="calculadoraTheme"
										to="https://calc-unal.vercel.app?from=cuna.com.co"
										icon="calculator"
										label="Calculadora de PAPPI"
										target="_blank"
									/>
								</li>
								<li class="x-fit">
									<XamuBoxAction
										:theme="estudiantesTheme"
										to="https://losestudiantes.com/universidad-nacional?from=cuna.com.co"
										icon="hand-fist"
										label="Los estudiantes"
										target="_blank"
									/>
								</li>
							</ul>
						</div>
					</div>
				</ClientOnly>
				<div class="txt --txtAlign-center --txtSize-xs --txtColor-dark5 --minWidth-100">
					<p v-if="SESSION.token">
						Visita cada curso para obtener los cupos en tiempo real desde el SIA.
					</p>
					<p>No dudes en reportar cualquier problema o sugerencia a nuestro instagram.</p>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
	import deburr from "lodash-es/deburr";

	import type { iGetPage, iPage } from "@open-xamu-co/ui-common-types";
	import { eSizes, eColors } from "@open-xamu-co/ui-common-enums";

	import type { Course } from "~/utils/types/index.ts";
	import type {
		CourseValues,
		CourseValuesWithCode,
		CourseValuesWithName,
		PartialCourseValues,
	} from "~/utils/types/values.ts";

	/**
	 * Landing page
	 *
	 * @page
	 */

	definePageMeta({
		title: "Buscador de cursos",
	});

	const INSTANCE = useInstanceStore();
	const SESSION = useSessionStore();
	const route = useRoute();

	const calculadoraTheme = "calculadora" as any;
	const estudiantesTheme = "estudiantes" as any;

	const search = ref<string>();
	const emittedRefresh = ref<() => void>();

	const SIAMaintenanceTillAt = computed(() => {
		const date = new Date(INSTANCE.config?.siaMaintenanceTillAt || new Date());

		return useTimeAgo(date);
	});
	const selectedLevel = computed({
		get: () => SESSION.level,
		set: (value) => {
			SESSION.setLevel(value);
		},
	});
	const selectedPlace = computed({
		get: () => SESSION.place,
		set: (value) => {
			SESSION.setPlace(value);
		},
	});
	const { selectedFaculty, selectedProgram, faculties, programs } = useCourseProgramOptions(
		[selectedLevel, selectedPlace, SESSION.lastFacultySearch, SESSION.lastProgramSearch],
		{ noUndef: true }
	);
	const { selectedTypology, typologies } = useCourseTypeOptions([SESSION.lastTypologySearch]);
	const isCodeSearch = computed<boolean>(() => !!search.value && /^\d/.test(search.value));
	const values = computed<CourseValues>(() => {
		const payload: PartialCourseValues = {
			level: selectedLevel.value,
			place: selectedPlace.value,
			faculty: selectedFaculty.value,
			program: selectedProgram.value,
		};

		const searchValue = deburr((search.value || "").trim().toLowerCase());

		if (isCodeSearch.value) return <CourseValuesWithCode>{ ...payload, code: searchValue };

		return <CourseValuesWithName>{
			...payload,
			typology: selectedTypology.value,
			name: searchValue,
		};
	});

	const coursesSearchPage: iGetPage<Course> = async (pagination: any) => {
		// Don't search if metadata is missing
		if (!pagination?.level || !pagination?.place) return;

		const page: iPage<Course> | undefined = await customFetch<iPage<Course> | undefined>(
			"/api/instance/courses/search",
			{
				method: "POST",
				query: pagination,
				credentials: "omit",
				headers: { "Cache-Control": "no-store" },
				cache: "no-store",
			}
		);

		// For fuzzy search, sort exact match first
		if (page && "name" in pagination) {
			const name: string = pagination.name;
			const [nameFirst] = name.split(" ");

			// Sort by exact match first, then similar
			page.edges.sort((a, b) => {
				const aName = deburr(a.node.name?.toLowerCase() || "");
				const bName = deburr(b.node.name?.toLowerCase() || "");

				// Exact match
				const aExact = aName === name;
				const bExact = bName === name;

				if (aExact !== bExact) return aExact ? -1 : 1;

				// Prefix match
				const aPrefix = aName.startsWith(nameFirst);
				const bPrefix = bName.startsWith(nameFirst);

				if (aPrefix !== bPrefix) return aPrefix ? -1 : 1;

				// Keep Firestore order
				return 0;
			});
		}

		return page;
	};

	// lifecycle
	watch(
		[selectedFaculty, selectedProgram, selectedTypology],
		([newFaculty, newProgram, newTypology]) => {
			if (!newFaculty || !newProgram) return;

			SESSION.setLastSearch(newFaculty, newProgram, newTypology);
		},
		{ immediate: false }
	);
</script>

<style scoped lang="scss">
	@media only screen {
		.x-fit .box {
			aspect-ratio: 4/5;
			width: 8rem;
		}
		.x-box {
			border-radius: 2rem;
		}
		.x-search-reset {
			position: absolute;
			top: 50%;
			right: 1rem;
			transform: translateY(-50%);
			z-index: 1;
		}
	}
</style>
