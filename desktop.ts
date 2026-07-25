/// <reference lib="deno.ns" />
import type { iCoursesPayload, iGroupsPayload } from "./functions-scrapper/src/types/scrapper.ts";
import { scrapeCourseGroupsLocal, scrapeCoursesLocal } from "./desktopScraper.ts";

const PORT = 39123;

function corsHeaders() {
	return {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
	};
}

console.log(`Starting Cuna Desktop Local Scraper Agent on http://127.0.0.1:${PORT}...`);

Deno.serve({ port: PORT }, async (req: Request) => {
	const url = new URL(req.url);

	// Handle CORS preflight
	if (req.method === "OPTIONS") {
		return new Response(null, { status: 204, headers: corsHeaders() });
	}

	// Health check endpoint
	if (url.pathname === "/health" || url.pathname === "/") {
		return Response.json(
			{
				status: "ok",
				service: "cuna-desktop-agent",
				version: "1.0.0",
				os: Deno.build.os,
				arch: Deno.build.arch,
			},
			{ headers: corsHeaders() }
		);
	}

	// Scrape courses endpoint
	if (url.pathname === "/scrape-courses" && req.method === "POST") {
		try {
			const body: iCoursesPayload = await req.json();

			if (!body.place || !body.faculty || !body.program) {
				return Response.json(
					{ error: "Missing required fields: place, faculty, program" },
					{ status: 400, headers: corsHeaders() }
				);
			}

			console.log(
				`[Scraper] Executing local course scrape: ${body.place} / ${body.faculty} / ${body.program}...`
			);

			const courses = await scrapeCoursesLocal(body);

			return Response.json(
				{ success: true, count: courses.length, data: courses },
				{ headers: corsHeaders() }
			);
		} catch (err) {
			console.error("[Scraper Error]", err);

			if (err instanceof Error) {
				return Response.json(
					{ success: false, error: err.message },
					{ status: 500, headers: corsHeaders() }
				);
			}

			return Response.json(
				{ success: false, error: "Internal scraping error" },
				{ status: 500, headers: corsHeaders() }
			);
		}
	}

	// Scrape groups endpoint
	if (url.pathname === "/scrape-groups" && req.method === "POST") {
		try {
			const body: iGroupsPayload = await req.json();

			if (!body.course || !body.faculty || !body.program) {
				return Response.json(
					{ error: "Missing required fields: course, faculty, program" },
					{ status: 400, headers: corsHeaders() }
				);
			}

			console.log(
				`[Scraper] Executing local group scrape for course ${body.course.code || "unknown"}...`
			);

			const result = await scrapeCourseGroupsLocal(body);

			return Response.json(
				{
					success: true,
					count: result.links.length,
					data: result.links,
					errors: result.errors,
				},
				{ headers: corsHeaders() }
			);
		} catch (err) {
			console.error("[Scraper Error]", err);

			if (err instanceof Error) {
				return Response.json(
					{ success: false, error: err.message },
					{ status: 500, headers: corsHeaders() }
				);
			}

			return Response.json(
				{ success: false, error: "Internal group scraping error" },
				{ status: 500, headers: corsHeaders() }
			);
		}
	}

	return Response.json({ error: "Endpoint not found" }, { status: 404, headers: corsHeaders() });
});
