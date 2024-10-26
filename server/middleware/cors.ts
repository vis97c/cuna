// TODO: Handle cors properly
export default defineEventHandler((event) => {
	const config = useRuntimeConfig();

	if (config.public.production) return;

	setResponseHeaders(event, {
		"Access-Control-Allow-Methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Credentials": "true",
		"Access-Control-Allow-Headers": "*",
		"Access-Control-Expose-Headers": "*",
	} as any);

	if (event.method === "OPTIONS") {
		event.node.res.statusCode = 204;
		event.node.res.statusMessage = "No Content.";

		return "OK";
	}
});
