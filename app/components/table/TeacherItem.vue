<template>
	<div class="flx --flxRow --flx-between-center --flx">
		<XamuModal
			class="--txtColor"
			title="Editar slug de los estudiantes"
			:theme="estudiantesTheme"
			:save-button="{ title: 'Editar slug' }"
			:hide="unassigned || !teacherData.id || !USER.canModerate"
			invert-theme
			@close="() => closeAddSlug()"
			@save="addSlug"
		>
			<template #toggle="{ toggleModal }">
				<XamuActionLink
					v-if="!unassigned && teacherData.id && USER.canModerate"
					:theme="estudiantesTheme"
					tooltip="Ver detalles del docente"
					@click="toggleModal"
				>
					<XamuIconFa name="hand-fist" />
					<span>{{ teacherData.name }}</span>
				</XamuActionLink>
				<XamuActionLink
					v-else-if="teacherData.losEstudiantesSlug"
					:theme="estudiantesTheme"
					tooltip="Ver en los estudiantes"
					:href="`${losEstudiantesProfessors}/${teacherData.losEstudiantesSlug}?from=cuna.com.co`"
					:data-id="teacherData.id"
				>
					<XamuIconFa name="hand-fist" />
					<span>{{ teacherData.name }}</span>
				</XamuActionLink>
				<span v-else :data-id="teacherData.id">{{ teacherData.name }}</span>
			</template>
			<template #default="{ invertedTheme }">
				<div class="--maxWidth-440">
					<XamuForm
						v-model="addSlugInputs"
						v-model:invalid="invalidAddSlug"
						:theme="invertedTheme"
						title="Actualizar slug"
					/>
				</div>
			</template>
			<template #footer-actions="{ save }">
				<XamuActionButtonToggle
					:theme="estudiantesTheme"
					tooltip="Ver en los estudiantes"
					tooltip-position="right"
					:href="`${losEstudiantesProfessors}/${teacherData.losEstudiantesSlug}?from=cuna.com.co`"
					:data-id="teacherData.id"
					round
				>
					<XamuIconFa name="hand-fist" />
					<XamuIconFa name="hand-fist" />
				</XamuActionButtonToggle>
				<XamuActionButton :theme="estudiantesTheme" @click="save">
					Editar slug
				</XamuActionButton>
			</template>
		</XamuModal>
	</div>
</template>
<script setup lang="ts">
	import { FirebaseError } from "firebase/app";
	import deburr from "lodash-es/deburr";

	import type { iInvalidInput, iNodeFnResponseStream } from "@open-xamu-co/ui-common-types";
	import type { FormInput } from "@open-xamu-co/ui-common-helpers";

	import type { Teacher, TeacherRef } from "~/utils/types";

	/**
	 * Teachers list
	 *
	 * @component
	 */

	const props = defineProps<{
		teacher: string | Teacher;
	}>();

	const CUNA = useCunaStore();
	const USER = useUserStore();
	const { getResponse } = useFormInput();
	const Swal = useSwal();

	const losEstudiantesProfessors = computed(() => {
		const config = CUNA.config || {};
		const { losEstudiantesUrl = "", losEstudiantesProfessorsPath = "" } = config;

		return `${losEstudiantesUrl}${losEstudiantesProfessorsPath}`;
	});
	const estudiantesTheme = "estudiantes" as any;

	const updatedSlug = ref("");
	const addSlugInputs = ref<FormInput[]>();
	const invalidAddSlug = ref<iInvalidInput[]>([]);

	const teacherData = computed<Teacher>(() => {
		if (typeof props.teacher == "string") return { name: props.teacher };

		return {
			...props.teacher,
			losEstudiantesSlug: props.teacher.losEstudiantesSlug || updatedSlug.value,
		};
	});
	const unassigned = computed(() => {
		const clean = deburr(teacherData.value.name?.toLowerCase() || "");

		return clean.includes("informado") || clean.includes("docente");
	});

	function closeAddSlug(teacher: Teacher = teacherData.value) {
		addSlugInputs.value = useTeacherSlugInputs(teacher);
		invalidAddSlug.value = [];
	}
	async function addSlug(willOpen: () => void, event: Event) {
		const { invalidInputs, withErrors, validationHadErrors, errors } = await getResponse<
			iNodeFnResponseStream<Teacher>[0],
			Teacher
		>(
			async ({ losEstudiantesSlug = "" }) => {
				if (!teacherData.value?.id) return { data: undefined };

				try {
					// update teacher
					const [data] = await useDocumentUpdate<TeacherRef>(teacherData.value, {
						losEstudiantesSlug,
					});
					const [updatedTeacher] = Array.isArray(data) ? data : [data];

					if (typeof updatedTeacher !== "object") return { errors: "Missing data" };

					updatedSlug.value = losEstudiantesSlug;

					return { data };
				} catch (errors: FirebaseError | unknown) {
					return { errors };
				}
			},
			addSlugInputs.value,
			event
		);

		invalidAddSlug.value = invalidInputs;

		if (!withErrors) {
			// Succesful request, notify user of the success
			Swal.fire({
				title: "Slug de los estudiantes agregado exitosamente",
				text: "En breve veras tu slug nuevo",
				icon: "success",
				willOpen,
			});
		} else {
			if (!validationHadErrors) {
				Swal.fire({
					title: "¡Algo sucedió!",
					text: "Ocurrió un error mientras añadíamos el slug",
					icon: "error",
					target: <HTMLElement>event.target,
				});

				if (errors instanceof FirebaseError) console.debug(errors.code, errors);
				else console.error(errors);
			}
		}
	}

	watch(teacherData, closeAddSlug, { immediate: true });
</script>
