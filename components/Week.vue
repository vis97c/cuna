<template>
	<div class="scroll --horizontal --always --maxWidthVw-70:md">
		<div class="flx --flxRow --flx-start-strecth --gap-5 --pTop-5 --width-100">
			<div class="flx --flxColumn --flx-start-stretch --flx --height-100">
				<div class="flx --flxRow --flx-start-strecth --gap-5 --pTop-5 --width-100">
					<span class="--txtSize-xs --txtColor-light" style="width: 2.4rem">Franja</span>
					<ul class="grd --grdColumns-6 --gap-5">
						<li
							v-for="{ day } in week"
							:key="day"
							class="grd-item flx --flxRow --flx-center"
						>
							<span class="--txtSize-xs">{{ day }}</span>
						</li>
					</ul>
				</div>
				<div class="flx --flxRow --flx-start-strecth --gap-5 --width-100 --height-100">
					<div class="back --opacity-02 --overflow-visible">
						<ul class="grd --grdRows-14 --gap-5 --width-100 --height-100">
							<li
								v-for="span in 14"
								:key="`back-${span}`"
								class="grd-item flx --flxRow --flx-center-start"
							>
								<!-- 1h span -->
								<div class="--width-100 --pTop-5">
									<div
										class="back flx --flxRow --flx-center"
										style="transform: translateY(-100%)"
									>
										<hr class="--solid" />
									</div>
								</div>
							</li>
						</ul>
					</div>
					<ul class="grd --grdRows-14 --gap-5 --width-100 --minHeight-100">
						<li
							v-for="span in 14"
							:key="`morning-${span}`"
							class="grd-item flx --flxRow --flx-start-center"
						>
							<!-- 1h span -->
							<span class="--txtSize-xs" style="width: 2.4rem">
								{{ getHour(span) }}
							</span>
						</li>
					</ul>
					<div class="grd --grdColumns-6 --gap-5">
						<div v-for="{ day, schedules } in week" :key="day" class="gdr-item">
							<ul class="grd --grdRows-14 --gap-5 --width-100 --height-100">
								<li
									v-for="(schedule, scheduleIndex) in schedules"
									:key="scheduleIndex"
									:style="{
										gridRow: `${schedule.startsAt} / span ${schedule.duration}`,
									}"
									class="grd-item scroll --vertical --always x-scroll"
								>
									<div
										class="flx --flxColumn --flx-start-stretch --gap-5 --minHeight-100 --bgColor-light"
									>
										<XamuBaseBox
											v-for="group in schedule.groups"
											:key="group.name"
											:theme="group.theme"
											:el="XamuBaseAction"
											class="x-class --flx-center --flx --p-5 --gap-5 --txtSize-xs"
											:disabled="highlight && highlight !== group.courseCode"
											:to="`/cursos/${getDocumentId(group.courseId)}`"
											:title="`${getHour(schedule.startsAt)} a ${getHour(schedule.startsAt + group.duration)}`"
											button
										>
											<span class="--txtWrap --txtWeight --txtAlign-center">
												{{ group.courseName }}
											</span>
											<span class="--txtAlign-center">{{ group.name }}</span>
										</XamuBaseBox>
									</div>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { eColors, eThemeColors } from "@open-xamu-co/ui-common-enums";

	import { XamuBaseAction } from "#components";

	import { getDocumentId } from "~/resources/utils/firestore";
	import type { EnrolledGroup } from "~/functions/src/types/entities";

	interface ScheduledGroup {
		groups: (EnrolledGroup & { duration: number; theme: eThemeColors })[];
		startsAt: number;
		duration: number;
	}

	const props = defineProps<{
		enrolledGroups: EnrolledGroup[];
		/**
		 * Course code to highlight
		 */
		highlight?: string;
	}>();

	const themes = [
		eColors.PRIMARY,
		eColors.SECONDARY,
		eColors.SUCCESS,
		"calculadora" as any,
		eColors.DANGER,
		eColors.SECONDARY_COMPLEMENT,
		"estudiantes" as any,
	];
	const week = computed(() => {
		const enrolled: ScheduledGroup[][] = [[], [], [], [], [], [], []];

		props.enrolledGroups.forEach((group, groupIndex) => {
			const nameModule = groupIndex % themes.length;
			const theme = themes[nameModule];

			group.schedule?.forEach((interval, dayIndex) => {
				if (!interval) return;

				const schedule = interval.split("|");
				const startsAt = Number(schedule[0].split(":")[0]) - 5;
				const endsAt = Number(schedule[1].split(":")[0]) - 5;
				const duration = endsAt - startsAt;
				const enrolledIndex = enrolled[dayIndex].findIndex((r) => r.startsAt === startsAt);
				const extendedGroup = { ...group, duration, theme };

				if (enrolledIndex >= 0) {
					enrolled[dayIndex][enrolledIndex].duration = Math.max(
						enrolled[dayIndex][enrolledIndex].duration,
						duration
					);

					return enrolled[dayIndex][enrolledIndex].groups.push(extendedGroup);
				}

				enrolled[dayIndex].push({ groups: [extendedGroup], startsAt, duration });
			});
		});

		const [monday, tuesday, wednesday, thursday, friday, saturday] = enrolled;

		return [
			{ day: "Lunes", schedules: monday },
			{ day: "Martes", schedules: tuesday },
			{ day: "Miércoles", schedules: wednesday },
			{ day: "Jueves", schedules: thursday },
			{ day: "Viernes", schedules: friday },
			{ day: "Sábado", schedules: saturday },
		];
	});

	function getHour(hour: number) {
		const newHour = hour > 7 ? hour - 7 : hour + 5;
		const ampm = hour > 6 ? "pm" : "am";

		return newHour + ampm;
	}
</script>

<style lang="scss">
	@use "@/assets/scss/overrides" as utils;

	@media only screen {
	}
</style>

<style lang="scss" scoped>
	@use "@/assets/scss/overrides" as utils;

	@media only screen {
		.x-class {
			border-radius: 0.5rem;
		}
		.x-scroll {
			max-height: 6rem;
			border-radius: 0.5rem;
		}
	}
</style>
