import type { ScrapedWith } from "~/functions/src/types/entities";
import type { Group } from "./entities";

export interface ScrapedCourse {
	groups?: Group[];
	name: string;
	code: string;
	description: string;
	lastScrapedWith: ScrapedWith;
}
