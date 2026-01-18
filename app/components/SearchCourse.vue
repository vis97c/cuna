<template>
	<section class="flx --flxColumn --flx-start-center --gap-30:sm --width-100 --maxWidth-980">
		<XamuBaseBox
			class="x-box flx --flxColumn --flx-start-stretch --width-100 --p-20:md"
			transparent
		>
			<ClientOnly>
				<form
					class="flx --flxRow --flx-start-center --gap-5 --width-100"
					@submit.prevent="emittedRefresh"
				>
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
				</form>
				<div class="flx --flxRow-wrap --flx-start-center --gap-5 --txtSize-xs --width-100">
					<template v-if="!isCodeSearch">
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
					</template>
					<div
						v-if="!CUNA.config?.explorerV2MaintenanceTillAt"
						class="flx --flxColumn --flx-start --flx --gap-5"
					>
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
			</ClientOnly>
		</XamuBaseBox>
		<XamuPaginationContent
			v-if="search"
			v-slot="{ content, currentPage, pagination }"
			:page="coursesSearchPage"
			url="api:instance:courses:search"
			:defaults="{
				level: 1,
				page: true,
				...values,
			}"
			:first="30"
			:no-content-message="
				search
					? `Sin resultados para ${search}`
					: 'No hay cursos disponibles en este momento. Vuelve más tarde.'
			"
			label="Cargando cursos..."
			with-route
			class="flx --flxColumn --flx-start-center --gap-30"
			@refresh="(e) => (emittedRefresh = e)"
		>
			<div class="txt">
				<div>
					<h3>
						Resultados de la búsqueda
						<template v-if="lastSearch?.name || lastSearch?.code">
							de "{{ lastSearch?.name || lastSearch?.code }}"
						</template>
						:
					</h3>
					<p class="--txtSize-xs">Cursos preindexados.</p>
				</div>
				<p>
					{{ currentPage.totalCount }} resultados. Pagina
					{{ currentPage.pageInfo.pageNumber }} de
					{{ Math.ceil(currentPage.totalCount / (pagination.first || 30)) }}.
				</p>
			</div>
			<div class="flx --flxRow-wrap --flx-center-start --gapY-30 --gap-30:md --width-100">
				<ItemCourse v-for="course in content" :key="course.id" :course="course" />
			</div>
		</XamuPaginationContent>
	</section>
</template>

<script setup lang="ts">
	import type { iGetPage, iPage } from "@open-xamu-co/ui-common-types";
	import { eSizes } from "@open-xamu-co/ui-common-enums";

	import type { Course } from "~/utils/types";
	import type {
		CourseValues,
		CourseValuesWithCode,
		CourseValuesWithProgram,
		PartialCourseValues,
	} from "~/utils/types/values";

	/**
	 * Registering unindexed courses
	 *
	 * @component
	 */

	const CUNA = useCunaStore();
	const USER = useUserStore();
	const { cache } = useRuntimeConfig().public;

	const search = ref<string>();
	const lastSearch = ref<CourseValues & { page?: number }>();
	const emittedRefresh = ref<() => void>();

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
		true
	);
	const { selectedTypology, typologies } = useCourseTypeOptions();
	const isCodeSearch = computed<boolean>(() => !!search.value && /^\d/.test(search.value));
	const values = computed<CourseValues>(() => {
		const payload: PartialCourseValues = {
			level: selectedLevel.value,
			place: selectedPlace.value,
			typology: selectedTypology.value,
		};

		const searchValue = (search.value || "").trim();

		if (isCodeSearch.value) return <CourseValuesWithCode>{ ...payload, code: searchValue };

		return <CourseValuesWithProgram>{
			...payload,
			name: searchValue,
			faculty: selectedFaculty.value,
			program: selectedProgram.value,
		};
	});

	const coursesSearchPage: iGetPage<Course> = async (pagination) => {
		if (!search.value) return;

		return useQuery<iPage<Course> | undefined>("/api/instance/courses/search", {
			query: pagination,
			headers: { "Cache-Control": cache.normal },
		});
	};
</script>

<style lang="scss">
	@media only screen {
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
