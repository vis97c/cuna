<template>
	<div id="landing" class="view">
		<section class="view-item --minHeightVh-100 --bgColor-light">
			<div class="holder flx --flxColumn --flx-center">
				<div class="txt --txtAlign-center --txtColor-dark5 --gap-5">
					<h1 class="--txtLineHeight-sm">
						<XamuActionLink to="/" class="no--override no--route --gap">
							<span class="--txtLineHeight-sm">cuna</span>
							<XamuIconFa name="chess-knight" :size="10" />
						</XamuActionLink>
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
					<div class="flx --flxRow --flx-center --gap-10 --txtSize-xs">
						<XamuActionLink
							href="https://github.com/vis97c/cuna"
							tooltip="Código fuente. GNU GPL v3"
						>
							<XamuIconFa name="github" brand />
						</XamuActionLink>
						<span v-if="CUNA.config?.version">
							{{ CUNA.config.version }} Powered by
							<a href="https://xamu.com.co" target="_blank">Xamu.</a>
						</span>
					</div>
				</div>
				<div v-if="CUNA.SIAMaintenance" class="txt --txtAlign-center --gap-10">
					<h4>El SIA se encuentra en mantenimiento</h4>
					<p class="--txtSize-sm --txtColor-dark5">
						Puedes explorar los cursos previamente guardados, pero el buscador estará
						inactivo y los cursos no se actualizarán hasta que el mantenimiento termine.
					</p>
					<p
						class="--txtSize-xs --txtColor-dark5"
						:title="CUNA.config?.siaMaintenanceTillAt?.toString()"
					>
						Volveremos a la normalidad {{ SIAMaintenanceTillAt }}.
					</p>
				</div>
				<div
					v-else-if="!USER.token && route.path != '/ingresar'"
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
										class="--minWidth-100"
									/>
									<XamuActionLink
										v-if="search"
										class="x-search-reset"
										@click="() => (search = '')"
									>
										<XamuIconFa name="xmark" :size="20" />
									</XamuActionLink>
								</div>
							</div>
							<div
								v-if="!isCodeSearch"
								class="flx --flxRow-wrap --flx-start-center --gap-5 --txtSize-xs --width-100"
							>
								<div class="flx --flxColumn --flx-start --flx --gap-5">
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
								<div class="flx --flxColumn --flx-start --flx --gap-5">
									<p class="">Programa</p>
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
						</form>
					</XamuBaseBox>
					<XamuPaginationContent
						v-if="search && search.trim().length >= 3"
						v-slot="{ content }"
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
						class="flx --flxColumn --flx-start-center --gap-30 --width-100 --maxWidth-770"
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
					<div v-else-if="USER.token" class="flx --flxColumn --flx-center --width-100">
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
					<p v-if="USER.token">
						Visita cada curso para obtener los cupos en tiempo real desde el SIA.
					</p>
					<p>No dudes en reportar cualquier problema o sugerencia a nuestro instagram.</p>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
	import type { iGetPage, iPage } from "@open-xamu-co/ui-common-types";
	import { eSizes, eColors } from "@open-xamu-co/ui-common-enums";

	import type { Course } from "~/utils/types";
	import type {
		CourseValues,
		CourseValuesWithCode,
		CourseValuesWithProgram,
		PartialCourseValues,
	} from "~/utils/types/values";
	import deburr from "lodash-es/deburr";

	/**
	 * Landing page
	 *
	 * @page
	 */

	definePageMeta({
		title: "Buscador de cursos",
	});

	const CUNA = useCunaStore();
	const USER = useUserStore();
	const route = useRoute();

	const calculadoraTheme = "calculadora" as any;
	const estudiantesTheme = "estudiantes" as any;

	const search = ref<string>();
	const emittedRefresh = ref<() => void>();

	const SIAMaintenanceTillAt = computed(() => {
		const date = new Date(CUNA.config?.siaMaintenanceTillAt || new Date());

		return useTimeAgo(date);
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
	const { selectedFaculty, selectedProgram, faculties, programs } = useCourseProgramOptions(
		[selectedLevel, selectedPlace, USER.lastFacultySearch, USER.lastProgramSearch],
		{ noUndef: true, saveSearch: true }
	);
	const { selectedTypology, typologies } = useCourseTypeOptions();
	const isCodeSearch = computed<boolean>(() => !!search.value && /^\d/.test(search.value));
	const values = computed<CourseValues>(() => {
		const payload: PartialCourseValues = {
			level: selectedLevel.value,
			place: selectedPlace.value,
		};

		const searchValue = deburr((search.value || "").trim().toLowerCase());

		if (isCodeSearch.value) return <CourseValuesWithCode>{ ...payload, code: searchValue };

		return <CourseValuesWithProgram>{
			...payload,
			typology: selectedTypology.value,
			name: searchValue,
			faculty: selectedFaculty.value,
			program: selectedProgram.value,
		};
	});

	const coursesSearchPage: iGetPage<Course> = async (pagination: any) => {
		// Don't search if metadata is missing
		if (!pagination?.level || !pagination?.place) return;

		const page: iPage<Course> | undefined = await useCsrfQuery<iPage<Course> | undefined>(
			"/api/instance/courses/search",
			{
				method: "POST",
				query: pagination,
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
