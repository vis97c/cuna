export default defineNuxtPlugin(({ hook }) => {
	hook("app:mounted", () => {
		document.body.classList.add("is--loaded");
	});
});
