import { eMQ } from "@open-xamu-co/ui-common-enums";

import { defineNuxtPlugin, useAppStore } from "#imports";

export default defineNuxtPlugin({
	name: "loaded",
	dependsOn: ["pinia", "firebase-setup"],
	parallel: true,
	setup: ({ hook }) => {
		hook("app:mounted", () => {
			document.body.classList.add("is--loaded");

			if (import.meta.server) return;

			const APP = useAppStore();

			function tvMQHandler(e: MediaQueryListEvent) {
				APP.setTvMQRange(e.matches);
			}

			function laptopMQHandler(e: MediaQueryListEvent) {
				APP.setLaptopMQRange(e.matches);
			}

			function tabletMQHandler(e: MediaQueryListEvent) {
				APP.setTabletMQRange(e.matches);
			}

			function mobileMQHandler(e: MediaQueryListEvent) {
				APP.setMobileMQRange(e.matches);
			}

			function smartwatchMQHandler(e: MediaQueryListEvent) {
				APP.setSmartwatchMQRange(e.matches);
			}

			const tvMQList = window.matchMedia(eMQ.TV);
			const laptopMQList = window.matchMedia(eMQ.LAPTOP);
			const tabletMQList = window.matchMedia(eMQ.TABLET);
			const mobileMQList = window.matchMedia(eMQ.MOBILE);
			const smartwatchMQList = window.matchMedia(eMQ.SMARTWATCH);

			APP.setTvMQRange(tvMQList.matches);
			APP.setLaptopMQRange(laptopMQList.matches);
			APP.setTabletMQRange(tabletMQList.matches);
			APP.setMobileMQRange(mobileMQList.matches);
			APP.setSmartwatchMQRange(smartwatchMQList.matches);

			// mount listeners
			tvMQList.addEventListener("change", tvMQHandler, true);
			laptopMQList.addEventListener("change", laptopMQHandler, true);
			tabletMQList.addEventListener("change", tabletMQHandler, true);
			mobileMQList.addEventListener("change", mobileMQHandler, true);
			smartwatchMQList.addEventListener("change", smartwatchMQHandler, true);
		});
	},
});
