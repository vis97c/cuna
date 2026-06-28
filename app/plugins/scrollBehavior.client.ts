import { createRouterScroller } from "vue-router-better-scroller";

import { defineNuxtPlugin } from "#imports";

interface SavedPosition {
	top?: number;
	left?: number;
	behavior?: ScrollOptions["behavior"];
}

function scrollHandler({ savedPosition }: { savedPosition?: SavedPosition }): SavedPosition {
	return savedPosition || { top: 0, left: 0, behavior: "smooth" };
}

export default defineNuxtPlugin({
	name: "scrollBehavior",
	parallel: true,
	setup: ({ vueApp }) => {
		vueApp.use(
			createRouterScroller({
				selectors: {
					window: scrollHandler,
					body: scrollHandler,
					".scrollable": scrollHandler,
				},
			})
		);
	},
});
