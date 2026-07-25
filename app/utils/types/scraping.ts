import type { ScrapedWith } from "~~/functions/src/types/entities/index.ts";
import type { Group } from "./entities/index.ts";

export interface ScrapedCourse {
	groups?: Group[];
	name: string;
	code: string;
	description: string;
	lastScrapedWith: ScrapedWith;
	errors?: unknown[];
}
